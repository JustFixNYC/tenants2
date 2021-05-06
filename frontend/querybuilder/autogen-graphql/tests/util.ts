import { buildSchema, assertInputObjectType } from "graphql";
import { assertNotUndefined } from "@justfixnyc/util";
import { ensureObjectType } from "../graphql-schema-util";

export const BEET_SCHEMA = buildSchema(`
  type Beet {
    name: String!,
    weight: Float!,
    friends: [Beet!]!
  }

  input TinySubformInput {
    disposition: String!
  }

  input BeetInput {
    beet: Beet!,
    tinySubforms: [TinySubformInput!]
  }

  type Mutation {
    eat(beetDeets: BeetInput!): Beet
  }
`);

export const BEET_TYPE = ensureObjectType(BEET_SCHEMA.getType("Beet"));

export const BEET_INPUT_TYPE = assertInputObjectType(
  BEET_SCHEMA.getType("BeetInput")
);

const beetFields = BEET_TYPE.getFields();

export const BEET_FIELDS = {
  name: assertNotUndefined(beetFields.name),
  weight: assertNotUndefined(beetFields.weight),
  friends: assertNotUndefined(beetFields.friends),
};
