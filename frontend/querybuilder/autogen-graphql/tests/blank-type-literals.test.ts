import { buildSchema, assertObjectType } from "graphql";
import { createBlankTypeLiteral } from "../blank-type-literals";

function buildObjectType(fields: string, name = 'AnonymousType') {
  return assertObjectType(buildSchema(`type ${name} { ${fields} }`).getType(name));
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
});
