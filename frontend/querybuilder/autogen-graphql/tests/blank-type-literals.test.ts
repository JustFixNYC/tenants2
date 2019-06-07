import { buildSchema, assertObjectType } from "graphql";
import { createBlankTypeLiteral, stringifyBlankTypeLiteral } from "../blank-type-literals";

function buildSchemaAndGetObjectType(graphql: string, typeName: string) {
  return assertObjectType(buildSchema(graphql).getType(typeName));
}

function buildObjectType(fields: string, name = 'AnonymousType') {
  return buildSchemaAndGetObjectType(`type ${name} { ${fields} }`, name);
}

function createBlankForFields(fields: string): any {
  return createBlankTypeLiteral(buildObjectType(fields));
}

describe("createBlankTypeLiteral()", () => {
  it("sets nullable fields to null", () => {
    expect(createBlankForFields('foo: Int')).toEqual({ foo: null });
  });

  it("sets non-nullable list fields to an empty list", () => {
    expect(createBlankForFields('foo: [Int]!')).toEqual({ foo: [] });
  });

  it("sets non-nullable int fields to zero", () => {
    expect(createBlankForFields('foo: Int!')).toEqual({ foo: 0 });
  });

  it("sets non-nullable float fields to zero", () => {
    expect(createBlankForFields('foo: Float!')).toEqual({ foo: 0.0 });
  });

  it("sets non-nullable string fields to the empty string", () => {
    expect(createBlankForFields('foo: String!')).toEqual({ foo: '' });
  });

  it("sets non-nullable boolean fields to false", () => {
    expect(createBlankForFields('foo: Boolean!')).toEqual({ foo: false });
  });

  it("sets non-nullable enum fields to their first value", () => {
    const type = buildSchemaAndGetObjectType(`
      enum Episode { NEWHOPE, EMPIRE, JEDI }
      type Blarg { episode: Episode! }
    `, 'Blarg');
    const literal = createBlankTypeLiteral(type);
    expect(literal).toEqual({
      episode: "__unquote(Episode.NEWHOPE)__"
    });
    expect(stringifyBlankTypeLiteral(literal)).toEqual([
      `{`,
      `  "episode": Episode.NEWHOPE`,
      `}`
    ].join('\n'));
  });
});
