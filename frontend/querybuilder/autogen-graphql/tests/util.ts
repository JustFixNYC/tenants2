import { buildSchema } from "graphql";
import { assertNotUndefined } from "../../../lib/util";
import { ensureObjectType } from "../graphql-schema-util";

export const BEET_SCHEMA = buildSchema(`
  type Beet {
    name: String!,
    weight: Float!,
    friends: [Beet!]!
  }
`);

export const BEET_TYPE = ensureObjectType(BEET_SCHEMA.getType('Beet'));

const beetFields = BEET_TYPE.getFields();

export const BEET_FIELDS = {
  name: assertNotUndefined(beetFields.name),
  weight: assertNotUndefined(beetFields.weight),
  friends: assertNotUndefined(beetFields.friends)
};
