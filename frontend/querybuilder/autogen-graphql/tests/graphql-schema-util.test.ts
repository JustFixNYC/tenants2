import {
  fullyUnwrapType,
  ensureObjectType,
  findContainedInputObjectTypes,
} from "../graphql-schema-util";
import { BEET_FIELDS, BEET_TYPE, BEET_INPUT_TYPE } from "./util";
import { buildSchema } from "graphql";

test("fullyUnwrapType() works", () => {
  expect(fullyUnwrapType(BEET_FIELDS.friends.type).toString()).toBe("Beet");
  expect(fullyUnwrapType(BEET_FIELDS.weight.type).toString()).toBe("Float");
});

test("ensureObjectType works", () => {
  expect(ensureObjectType(BEET_TYPE)).toBe(BEET_TYPE);
  expect(() => ensureObjectType(undefined)).toThrow(
    "undefined is not a valid GraphQL Object type."
  );
  expect(() =>
    ensureObjectType(buildSchema("enum Boop { FOO, BAR }").getType("Boop"))
  ).toThrow('"Boop" is not a valid GraphQL Object type.');
});

test("findContainedInputObjectTypes() works", () => {
  const types = findContainedInputObjectTypes(BEET_INPUT_TYPE).map(
    (t) => t.name
  );
  expect(types).toEqual(["TinySubformInput"]);
});
