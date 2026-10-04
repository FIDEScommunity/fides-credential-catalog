export type SchemaDocument = Record<string, unknown>;
export type SchemaDocumentLoader = (url: string) => Promise<SchemaDocument>;

const MAX_REFERENCE_DEPTH = 64;
const MAX_EXTERNAL_DOCUMENTS = 64;

function isRecord(value: unknown): value is SchemaDocument {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function documentUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.href;
}

function resolveJsonPointer(root: SchemaDocument, fragment: string): unknown {
  if (fragment === "" || fragment === "#") return root;
  if (!fragment.startsWith("#/")) return undefined;

  let pointer: string;
  try {
    pointer = decodeURIComponent(fragment.slice(2));
  } catch {
    return undefined;
  }

  let current: unknown = root;
  for (const rawSegment of pointer.split("/")) {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isRecord(current) && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Resolve JSON Schema references into a detached schema tree.
 *
 * Relative references deliberately use the retrieval URL as their base. Some published
 * schemas, including AP2, declare an unavailable `$id` URL while keeping working files
 * relative to the retrieval URL.
 */
export async function resolveSchemaReferences(
  rootSchema: SchemaDocument,
  retrievalUrl: string,
  loadDocument: SchemaDocumentLoader
): Promise<SchemaDocument> {
  const rootUrl = documentUrl(retrievalUrl);
  const documentCache = new Map<string, Promise<SchemaDocument>>();
  documentCache.set(rootUrl, Promise.resolve(rootSchema));

  const load = async (url: string): Promise<SchemaDocument> => {
    const normalizedUrl = documentUrl(url);
    const cached = documentCache.get(normalizedUrl);
    if (cached) return cached;
    if (documentCache.size >= MAX_EXTERNAL_DOCUMENTS) {
      throw new Error(`Schema reference document limit (${MAX_EXTERNAL_DOCUMENTS}) exceeded`);
    }
    const pending = loadDocument(normalizedUrl);
    documentCache.set(normalizedUrl, pending);
    try {
      return await pending;
    } catch (error) {
      documentCache.delete(normalizedUrl);
      throw error;
    }
  };

  const resolveNode = async (
    value: unknown,
    currentRoot: SchemaDocument,
    currentUrl: string,
    referenceStack: Set<string>,
    depth: number
  ): Promise<unknown> => {
    if (depth > MAX_REFERENCE_DEPTH) return value;
    if (Array.isArray(value)) {
      return Promise.all(
        value.map((entry) =>
          resolveNode(entry, currentRoot, currentUrl, referenceStack, depth + 1)
        )
      );
    }
    if (!isRecord(value)) return value;

    const ref = value.$ref;
    if (typeof ref === "string") {
      try {
        const absoluteReference = new URL(ref, currentUrl);
        const targetDocumentUrl = documentUrl(absoluteReference.href);
        const targetKey = `${targetDocumentUrl}${absoluteReference.hash}`;
        if (!referenceStack.has(targetKey)) {
          const targetRoot =
            targetDocumentUrl === documentUrl(currentUrl)
              ? currentRoot
              : await load(targetDocumentUrl);
          const target = resolveJsonPointer(targetRoot, absoluteReference.hash);
          if (isRecord(target)) {
            const nextStack = new Set(referenceStack);
            nextStack.add(targetKey);
            const resolvedTarget = await resolveNode(
              target,
              targetRoot,
              targetDocumentUrl,
              nextStack,
              depth + 1
            );
            const siblings = Object.fromEntries(
              Object.entries(value).filter(([key]) => key !== "$ref")
            );
            const resolvedSiblings = await resolveNode(
              siblings,
              currentRoot,
              currentUrl,
              referenceStack,
              depth + 1
            );
            if (isRecord(resolvedTarget) && isRecord(resolvedSiblings)) {
              return { ...resolvedTarget, ...resolvedSiblings };
            }
          }
        }
      } catch {
        // Keep unresolved references visible as type "ref" in the attribute extractor.
      }
    }

    const resolvedEntries = await Promise.all(
      Object.entries(value).map(async ([key, entry]) => [
        key,
        await resolveNode(entry, currentRoot, currentUrl, referenceStack, depth + 1)
      ] as const)
    );
    return Object.fromEntries(resolvedEntries);
  };

  const resolved = await resolveNode(rootSchema, rootSchema, rootUrl, new Set(), 0);
  return isRecord(resolved) ? resolved : rootSchema;
}
