import assert from "node:assert/strict";
import test from "node:test";
import {
  ARRAY_ITEM_PATH_SEGMENT,
  extractAttributesFromSchema,
  SCHEMA_ATTRIBUTES_MAX_COUNT,
  SCHEMA_ATTRIBUTES_MAX_DEPTH
} from "./schemaAttributes.js";
import { resolveSchemaReferences, type SchemaDocument } from "./schemaResolver.js";

test("flat root properties", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      name: { type: "string", description: "Display name" },
      age: { type: "integer" }
    },
    required: ["name"]
  });
  assert.equal(attrs.length, 2);
  const name = attrs.find((a) => a.name === "name");
  assert.ok(name);
  assert.equal(name!.required, true);
  assert.equal(name!.depth, 0);
  assert.equal(attrs.find((a) => a.name === "age")!.required, false);
});

test("credentialSubject.properties (VCDM-style)", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      credentialSubject: {
        type: "object",
        properties: {
          id: { type: "string" },
          degree: { type: "object", properties: { name: { type: "string" } } }
        },
        required: ["id"]
      }
    },
    required: ["credentialSubject"]
  });
  const id = attrs.find((a) => a.name === "id");
  assert.ok(id);
  assert.equal(id!.required, true);
  const nested = attrs.find((a) => a.name === "degree/name");
  assert.ok(nested);
  assert.equal(nested!.type, "string");
  assert.equal(nested!.depth, 1);
});

test("EU mdoc-style: unwrap literal 'properties' map under docType namespace", () => {
  const attrs = extractAttributesFromSchema({
    type: "object",
    properties: {
      "eu.europa.ec.eudi.pid.1": {
        type: "object",
        properties: {
          properties: {
            family_name: { type: "string", description: "Family Name(s)" },
            given_name: { type: "string", description: "Given Name(s)" }
          }
        }
      }
    }
  });
  assert.ok(!attrs.some((a) => a.name.includes("/properties")));
  const gn = attrs.find((a) => a.name === "eu.europa.ec.eudi.pid.1/given_name");
  assert.ok(gn);
  assert.equal(gn!.type, "string");
  assert.equal(gn!.description, "Given Name(s)");
});

test("dotted namespace as single path segment uses slash for nesting", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      "eu.europa.ec.eudi.pid.1": {
        type: "object",
        properties: {
          given_name: { type: "string", description: "Given name" },
          family_name: { type: "string" }
        },
        required: ["given_name"]
      }
    }
  });
  assert.ok(attrs.some((a) => a.name === "eu.europa.ec.eudi.pid.1"));
  const gn = attrs.find((a) => a.name === "eu.europa.ec.eudi.pid.1/given_name");
  assert.ok(gn);
  assert.equal(gn!.required, true);
  assert.equal(gn!.description, "Given name");
});

test("nested required array on object properties", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      wrapper: {
        type: "object",
        required: ["inner"],
        properties: {
          inner: { type: "string" },
          opt: { type: "boolean" }
        }
      }
    }
  });
  assert.equal(attrs.find((a) => a.name === "wrapper/inner")!.required, true);
  assert.equal(attrs.find((a) => a.name === "wrapper/opt")!.required, false);
});

test("array of objects: item properties under .../item/...", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            code: { type: "string" },
            value: { type: "string" }
          },
          required: ["code"]
        }
      }
    }
  });
  const code = attrs.find((a) => a.name === `claims/${ARRAY_ITEM_PATH_SEGMENT}/code`);
  assert.ok(code);
  assert.equal(code!.required, true);
});

test("$ref property is not expanded when target is missing", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      ext: { $ref: "#/definitions/foo" }
    }
  });
  assert.equal(attrs.length, 1);
  assert.equal(attrs[0]!.type, "ref");
});

test("same-document #/definitions $ref expands when target has properties", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      ext: { $ref: "#/definitions/foo" }
    },
    definitions: {
      foo: {
        type: "object",
        properties: {
          a: { type: "string", description: "A field" },
          b: { type: "number" }
        },
        required: ["a"]
      }
    }
  });
  const a = attrs.find((x) => x.name === "ext/a");
  assert.ok(a);
  assert.equal(a!.required, true);
  assert.equal(a!.type, "string");
  assert.equal(a!.description, "A field");
  assert.ok(attrs.some((x) => x.name === "ext/b"));
});

test("credentialSubject oneOf with $ref to $defs yields claim properties (Gaia-X style)", () => {
  const attrs = extractAttributesFromSchema({
    type: "object",
    properties: {
      credentialSubject: {
        oneOf: [{ $ref: "#/$defs/CredentialSubject" }]
      }
    },
    $defs: {
      CredentialSubject: {
        type: "object",
        required: ["id", "type"],
        properties: {
          id: { type: "string", format: "uri" },
          type: { type: "string" },
          "gx:name": { type: "string", description: "Resource name" }
        }
      }
    }
  });
  const id = attrs.find((a) => a.name === "id");
  assert.ok(id);
  assert.equal(id!.required, true);
  const gxName = attrs.find((a) => a.name === "gx:name");
  assert.ok(gxName);
  assert.equal(gxName!.description, "Resource name");
  assert.ok(!attrs.some((a) => a.name === "@context"), "VC envelope fields excluded when subject resolved");
});

test("nested oneOf: object branch with $ref expands under parent path", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      holder: {
        type: "object",
        properties: {
          "gx:ownedBy": {
            oneOf: [{ $ref: "#/$defs/IdRef" }, { type: "string", format: "uri" }]
          }
        }
      }
    },
    $defs: {
      IdRef: {
        type: "object",
        properties: {
          id: { type: "string", format: "uri" },
          sri: { type: "string" }
        },
        required: ["id"]
      }
    }
  });
  const id = attrs.find((a) => a.name === "holder/gx:ownedBy/id");
  assert.ok(id);
  assert.equal(id!.required, true);
  assert.ok(attrs.some((a) => a.name === "holder/gx:ownedBy/sri"));
});

test("AP2 Open Checkout Mandate: all anyOf constraint variants are expanded", () => {
  const attrs = extractAttributesFromSchema({
    type: "object",
    required: ["constraints"],
    properties: {
      constraints: {
        type: "array",
        items: {
          anyOf: [
            { $ref: "#/$defs/allowed_merchants" },
            { $ref: "#/$defs/line_items" }
          ]
        }
      }
    },
    $defs: {
      allowed_merchants: {
        type: "object",
        required: ["type", "allowed"],
        properties: {
          type: { type: "string" },
          allowed: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, name: { type: "string" } }
            }
          }
        }
      },
      line_items: {
        type: "object",
        required: ["type", "items"],
        properties: {
          type: { type: "string" },
          items: {
            type: "array",
            items: { $ref: "#/$defs/line_item_requirements" }
          }
        }
      },
      line_item_requirements: {
        type: "object",
        required: ["id", "acceptable_items", "quantity"],
        properties: {
          id: { type: "string" },
          acceptable_items: {
            type: "array",
            items: { $ref: "#/$defs/item" }
          },
          quantity: { type: "integer" }
        }
      },
      item: {
        type: "object",
        required: ["id", "title"],
        properties: {
          id: { type: "string" },
          title: { type: "string" }
        }
      }
    }
  });

  const names = new Set(attrs.map((attribute) => attribute.name));
  assert.ok(names.has("constraints/item/allowed"), "allowed_merchants branch is present");
  assert.ok(names.has("constraints/item/allowed/item/id"));
  assert.ok(names.has("constraints/item/items"), "line_items branch is present");
  assert.ok(names.has("constraints/item/items/item/id"));
  assert.ok(names.has("constraints/item/items/item/acceptable_items"));
  assert.ok(names.has("constraints/item/items/item/acceptable_items/item/id"));
  assert.ok(names.has("constraints/item/items/item/acceptable_items/item/title"));
  assert.ok(names.has("constraints/item/items/item/quantity"));
  assert.equal(
    attrs.filter((attribute) => attribute.name === "constraints/item/type").length,
    1,
    "shared variant fields are deduplicated"
  );
});

test("AP2 Payment Mandate: external relative $refs resolve to nested attributes", async () => {
  const rootUrl = "https://raw.example.test/ap2/payment_mandate.json";
  const root: SchemaDocument = {
    $id: "https://ap2-protocol.org/schemas/payment_mandate.json",
    type: "object",
    required: ["payee", "payment_amount", "payment_instrument"],
    properties: {
      payee: { description: "The merchant receiving the payment.", $ref: "types/merchant.json" },
      payment_amount: { $ref: "types/amount.json" },
      payment_instrument: { $ref: "types/payment_instrument.json" }
    }
  };
  const documents = new Map<string, SchemaDocument>([
    [
      "https://raw.example.test/ap2/types/merchant.json",
      {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          website: { type: "string" }
        }
      }
    ],
    [
      "https://raw.example.test/ap2/types/amount.json",
      {
        type: "object",
        required: ["amount", "currency"],
        properties: {
          amount: { type: "integer" },
          currency: { type: "string" }
        }
      }
    ],
    [
      "https://raw.example.test/ap2/types/payment_instrument.json",
      {
        type: "object",
        required: ["id", "type"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          description: { type: "string" }
        }
      }
    ]
  ]);
  const loaded: string[] = [];
  const resolved = await resolveSchemaReferences(root, rootUrl, async (url) => {
    loaded.push(url);
    const document = documents.get(url);
    if (!document) throw new Error(`Unexpected schema URL: ${url}`);
    return document;
  });
  const attrs = extractAttributesFromSchema(resolved);
  const names = new Set(attrs.map((attribute) => attribute.name));

  for (const name of [
    "payee/id",
    "payee/name",
    "payee/website",
    "payment_amount/amount",
    "payment_amount/currency",
    "payment_instrument/id",
    "payment_instrument/type",
    "payment_instrument/description"
  ]) {
    assert.ok(names.has(name), `${name} is present`);
  }
  assert.equal(attrs.find((attribute) => attribute.name === "payee")?.description,
    "The merchant receiving the payment.",
    "$ref sibling metadata is retained");
  assert.deepEqual(loaded.sort(), Array.from(documents.keys()).sort());
});

test("external $ref cycles terminate and retain unresolved ref fallback", async () => {
  const root: SchemaDocument = {
    properties: {
      node: { $ref: "node.json" }
    }
  };
  const resolved = await resolveSchemaReferences(
    root,
    "https://schemas.example.test/root.json",
    async () => ({
      type: "object",
      properties: {
        id: { type: "string" },
        child: { $ref: "node.json" }
      }
    })
  );
  const attrs = extractAttributesFromSchema(resolved);
  assert.ok(attrs.some((attribute) => attribute.name === "node/id"));
  assert.ok(attrs.some((attribute) => attribute.name.endsWith("/child") && attribute.type === "ref"));
});

test("respects SCHEMA_ATTRIBUTES_MAX_COUNT", () => {
  const props: Record<string, unknown> = {};
  for (let i = 0; i < SCHEMA_ATTRIBUTES_MAX_COUNT + 50; i++) {
    props[`f${i}`] = { type: "string" };
  }
  const attrs = extractAttributesFromSchema({ properties: props });
  assert.equal(attrs.length, SCHEMA_ATTRIBUTES_MAX_COUNT);
});

test("respects SCHEMA_ATTRIBUTES_MAX_DEPTH", () => {
  let schema: Record<string, unknown> = { type: "string" };
  for (let d = 0; d < SCHEMA_ATTRIBUTES_MAX_DEPTH + 5; d++) {
    schema = {
      type: "object",
      properties: { nest: schema }
    };
  }
  const attrs = extractAttributesFromSchema({
    properties: { root: schema }
  });
  const deepest = attrs.reduce((m, a) => Math.max(m, a.name.split("/").length), 0);
  assert.ok(deepest <= SCHEMA_ATTRIBUTES_MAX_DEPTH);
});
