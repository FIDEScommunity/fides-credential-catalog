import type { EnrichedAttribute } from "../types/credential.js";

/** Max nesting depth (path segments) when flattening schema properties. */
export const SCHEMA_ATTRIBUTES_MAX_DEPTH = 12;

/** Max number of attribute rows per credential (avoids huge schemas). */
export const SCHEMA_ATTRIBUTES_MAX_COUNT = 500;

/** Synthetic path segment for array item object properties (`field/item/nested`). */
export const ARRAY_ITEM_PATH_SEGMENT = "item";

/** Guard deep `oneOf`/`anyOf` recursion (e.g. accidental cycles). */
const PICK_EXPANDABLE_MAX_DEPTH = 32;

function getTypeFromSchemaProperty(propertySchema: Record<string, unknown>): string {
  const type = propertySchema.type;
  if (typeof type === "string") return type;
  if (Array.isArray(type) && type.length > 0) return String(type[0]);
  if (propertySchema.$ref) return "ref";
  if (propertySchema.oneOf) return "oneOf";
  if (propertySchema.anyOf) return "anyOf";
  if (propertySchema.allOf) return "allOf";
  return "unknown";
}

function isSchemaTypeObject(propertySchema: Record<string, unknown>): boolean {
  const t = propertySchema.type;
  if (t === "object") return true;
  if (Array.isArray(t)) return t.includes("object");
  return false;
}

function schemaHasProperties(propertySchema: Record<string, unknown>): boolean {
  const p = propertySchema.properties;
  return (
    p !== null &&
    p !== undefined &&
    typeof p === "object" &&
    !Array.isArray(p) &&
    Object.keys(p as Record<string, unknown>).length > 0
  );
}

/**
 * True when we can descend into .properties (object-shaped schema, not a bare $ref).
 */
function isObjectLikeWithProperties(propertySchema: Record<string, unknown>): boolean {
  if (propertySchema.$ref) return false;
  if (!schemaHasProperties(propertySchema)) return false;
  // JSON Schema: "properties" often implies object even if type is omitted
  if (propertySchema.type === undefined) return true;
  return isSchemaTypeObject(propertySchema);
}

function requiredStringSet(required: unknown): Set<string> {
  if (!Array.isArray(required)) return new Set();
  return new Set(required.filter((v): v is string => typeof v === "string"));
}

/**
 * Resolve a JSON Pointer (fragment only, same document) against the schema root.
 * Supports `#/$defs/X` and `#/definitions/X`.
 */
function resolveJsonPointer(root: Record<string, unknown>, pointer: string): unknown {
  if (pointer === "#" || pointer === "") return root;
  if (!pointer.startsWith("#")) return null;
  const segments = pointer.slice(1).split("/").filter((s) => s.length > 0);
  let cur: unknown = root;
  for (const raw of segments) {
    const seg = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cur === null || typeof cur !== "object" || Array.isArray(cur)) return null;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Follow in-document `$ref` chains (`#/…`) until a non-ref object or external/missing ref.
 */
function followRefChain(
  root: Record<string, unknown>,
  node: Record<string, unknown>,
  visited: Set<string>
): Record<string, unknown> {
  let current = node;
  for (;;) {
    const ref = current.$ref;
    if (typeof ref !== "string" || !ref.startsWith("#")) break;
    if (visited.has(ref)) break;
    visited.add(ref);
    const next = resolveJsonPointer(root, ref);
    if (!next || typeof next !== "object" || Array.isArray(next)) break;
    current = next as Record<string, unknown>;
  }
  return current;
}

/**
 * First object subschema in the same document that has a non-empty `properties` map
 * (after resolving refs, and optionally picking among `oneOf` / `anyOf` branches).
 * Used for Gaia-X-style `credentialSubject` and nested `$ref` / `oneOf` object shapes.
 */
function pickFirstExpandableObject(
  root: Record<string, unknown>,
  node: Record<string, unknown>,
  depth = 0
): Record<string, unknown> | null {
  if (depth > PICK_EXPANDABLE_MAX_DEPTH) return null;
  const derefed = followRefChain(root, node, new Set<string>());
  if (isObjectLikeWithProperties(derefed)) return derefed;

  const tryBranches = (branches: unknown[]): Record<string, unknown> | null => {
    for (const br of branches) {
      if (!br || typeof br !== "object" || Array.isArray(br)) continue;
      const sub = pickFirstExpandableObject(root, br as Record<string, unknown>, depth + 1);
      if (sub) return sub;
    }
    return null;
  };

  if (Array.isArray(derefed.oneOf)) {
    const r = tryBranches(derefed.oneOf);
    if (r) return r;
  }
  if (Array.isArray(derefed.anyOf)) {
    const r = tryBranches(derefed.anyOf);
    if (r) return r;
  }

  return null;
}

/**
 * Resolve `credentialSubject` to the object schema whose `properties` are credential claims
 * (inline VCDM, or `oneOf` + `#/$defs/…` as used by Gaia-X schemas).
 */
function resolveCredentialSubjectPropertySource(
  root: Record<string, unknown>
): { props: Record<string, unknown>; subjectRequired: Set<string> } | null {
  const topProps = root.properties as Record<string, unknown> | undefined;
  const cs = topProps?.credentialSubject as Record<string, unknown> | undefined;
  if (!cs) return null;

  const expanded = pickFirstExpandableObject(root, cs, 0);
  if (expanded && isObjectLikeWithProperties(expanded)) {
    return {
      props: expanded.properties as Record<string, unknown>,
      subjectRequired: requiredStringSet(expanded.required)
    };
  }
  return null;
}

/**
 * Keys that belong to a JSON Schema object definition (not credential field names).
 */
const JSON_SCHEMA_OBJECT_LEVEL_KEYS = new Set([
  "$schema",
  "$id",
  "$anchor",
  "$dynamicAnchor",
  "$ref",
  "$defs",
  "definitions",
  "title",
  "description",
  "default",
  "deprecated",
  "examples",
  "readOnly",
  "writeOnly",
  "type",
  "enum",
  "const",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "dependentSchemas",
  "properties",
  "additionalProperties",
  "patternProperties",
  "propertyNames",
  "required",
  "minProperties",
  "maxProperties",
  "items",
  "prefixItems",
  "contains",
  "unevaluatedItems",
  "unevaluatedProperties",
  "minContains",
  "maxContains",
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "format"
]);

/**
 * Some issuer-generated schemas (e.g. EU mdoc) use a property literally named "properties"
 * whose value is a map of claim name → subschema, without a JSON Schema `properties` wrapper.
 * When detected, we treat that map like normal nested fields.
 */
function implicitChildPropertyMap(node: Record<string, unknown>): Record<string, unknown> | null {
  if (node.$ref) return null;
  if (schemaHasProperties(node)) return null;

  const t = node.type;
  if (typeof t === "string" && t !== "object") return null;
  if (Array.isArray(t) && t.length > 0 && !t.includes("object")) return null;

  const keys = Object.keys(node);
  if (keys.length === 0) return null;

  for (const k of keys) {
    if (JSON_SCHEMA_OBJECT_LEVEL_KEYS.has(k)) return null;
  }

  for (const k of keys) {
    const v = node[k];
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const vs = v as Record<string, unknown>;
    const looksLikePropertySchema =
      typeof vs.type === "string" ||
      vs.$ref !== undefined ||
      Array.isArray(vs.anyOf) ||
      Array.isArray(vs.allOf) ||
      Array.isArray(vs.oneOf) ||
      typeof vs.description === "string" ||
      typeof vs.format === "string" ||
      schemaHasProperties(vs) ||
      vs.items !== undefined;
    if (!looksLikePropertySchema) return null;
  }

  return node;
}

function walkPropertyMap(
  props: Record<string, unknown>,
  pathPrefix: string[],
  parentRequired: Set<string>,
  out: EnrichedAttribute[],
  limits: { maxDepth: number; maxRows: number },
  schemaRoot: Record<string, unknown>
): void {
  if (pathPrefix.length >= limits.maxDepth || out.length >= limits.maxRows) return;

  for (const [key, value] of Object.entries(props)) {
    if (out.length >= limits.maxRows) return;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;

    const propertySchema = value as Record<string, unknown>;
    const displaySchema = followRefChain(schemaRoot, propertySchema, new Set<string>());
    const path = [...pathPrefix, key];
    if (path.length > limits.maxDepth) continue;

    const implicitMap = implicitChildPropertyMap(displaySchema);
    const unwrapPropertiesKey = key === "properties" && implicitMap !== null;

    if (!unwrapPropertiesKey) {
      const fullName = path.join("/");
      const depth = path.length - 1;
      out.push({
        name: fullName,
        type: getTypeFromSchemaProperty(displaySchema),
        required: parentRequired.has(key),
        description:
          typeof displaySchema.description === "string" ? displaySchema.description : undefined,
        depth
      });
    }

    // Array of objects: recurse into items.properties under .../item/...
    const types = displaySchema.type;
    const isArray =
      types === "array" || (Array.isArray(types) && types.includes("array"));
    if (isArray && out.length < limits.maxRows) {
      const items = displaySchema.items;
      if (items && typeof items === "object" && !Array.isArray(items)) {
        let itemSchema = followRefChain(schemaRoot, items as Record<string, unknown>, new Set<string>());
        const itemExpandable = pickFirstExpandableObject(schemaRoot, items as Record<string, unknown>, 0);
        if (itemExpandable && isObjectLikeWithProperties(itemExpandable)) {
          itemSchema = itemExpandable;
        }
        const itemBasePath = unwrapPropertiesKey ? pathPrefix : path;
        if (isObjectLikeWithProperties(itemSchema)) {
          const itemProps = itemSchema.properties as Record<string, unknown>;
          const itemReq = requiredStringSet(itemSchema.required);
          walkPropertyMap(
            itemProps,
            [...itemBasePath, ARRAY_ITEM_PATH_SEGMENT],
            itemReq,
            out,
            limits,
            schemaRoot
          );
        } else {
          const itemImplicit = implicitChildPropertyMap(itemSchema);
          if (itemImplicit) {
            walkPropertyMap(
              itemImplicit,
              [...itemBasePath, ARRAY_ITEM_PATH_SEGMENT],
              new Set(),
              out,
              limits,
              schemaRoot
            );
          }
        }
      }
    }

    if (unwrapPropertiesKey && implicitMap && out.length < limits.maxRows) {
      walkPropertyMap(implicitMap, pathPrefix, new Set(), out, limits, schemaRoot);
      continue;
    }

    if (implicitMap && !unwrapPropertiesKey && out.length < limits.maxRows) {
      walkPropertyMap(implicitMap, path, new Set(), out, limits, schemaRoot);
      continue;
    }

    // Nested object: inline properties, or same-document $ref / oneOf → object with properties
    const expandable = pickFirstExpandableObject(schemaRoot, propertySchema, 0);
    if (expandable && isObjectLikeWithProperties(expandable) && out.length < limits.maxRows) {
      const nestedProps = expandable.properties as Record<string, unknown>;
      const nestedReq = requiredStringSet(expandable.required);
      walkPropertyMap(nestedProps, path, nestedReq, out, limits, schemaRoot);
    } else if (isObjectLikeWithProperties(displaySchema) && out.length < limits.maxRows) {
      const nestedProps = displaySchema.properties as Record<string, unknown>;
      const nestedReq = requiredStringSet(displaySchema.required);
      walkPropertyMap(nestedProps, path, nestedReq, out, limits, schemaRoot);
    }
  }
}

/**
 * Flattens JSON Schema properties under credentialSubject (VCDM) or root into rows.
 * Paths use "/" to avoid ambiguity with dotted claim names (e.g. EU mdoc namespaces).
 */
export function extractAttributesFromSchema(schemaData: Record<string, unknown>): EnrichedAttribute[] {
  const topProps = schemaData.properties as Record<string, unknown> | undefined;
  if (!topProps || typeof topProps !== "object" || Array.isArray(topProps)) return [];

  const credentialSubject = topProps.credentialSubject as Record<string, unknown> | undefined;
  const subjectResolved = resolveCredentialSubjectPropertySource(schemaData);

  let props: Record<string, unknown>;
  let subjectLayerRequired: Set<string>;

  if (subjectResolved) {
    props = subjectResolved.props;
    subjectLayerRequired = subjectResolved.subjectRequired;
  } else {
    props = topProps;
    subjectLayerRequired = credentialSubject ? requiredStringSet(credentialSubject.required) : new Set();
  }

  if (!props || typeof props !== "object" || Array.isArray(props)) return [];

  const requiredSet = new Set<string>([
    ...requiredStringSet(schemaData.required),
    ...subjectLayerRequired
  ]);

  const out: EnrichedAttribute[] = [];
  walkPropertyMap(props, [], requiredSet, out, {
    maxDepth: SCHEMA_ATTRIBUTES_MAX_DEPTH,
    maxRows: SCHEMA_ATTRIBUTES_MAX_COUNT
  }, schemaData);
  return out;
}
