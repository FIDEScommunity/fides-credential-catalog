import assert from "node:assert/strict";
import test from "node:test";
import {
  ARRAY_ITEM_PATH_SEGMENT,
  extractAttributesFromSchema,
  SCHEMA_ATTRIBUTES_MAX_COUNT,
  SCHEMA_ATTRIBUTES_MAX_DEPTH
} from "./schemaAttributes.js";

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

test("$ref property is not expanded", () => {
  const attrs = extractAttributesFromSchema({
    properties: {
      ext: { $ref: "#/definitions/foo" }
    }
  });
  assert.equal(attrs.length, 1);
  assert.equal(attrs[0]!.type, "ref");
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
