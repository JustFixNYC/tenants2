import { buildSchema, isObjectType } from "graphql";
import { assertNotUndefined } from "../../../lib/util";

export const BEET_SCHEMA = buildSchema(`
  type Beet {
    name: String!,
    weight: Float!,
    friends: [Beet!]!
  }
`);

export const BEET_TYPE = ensureType(BEET_SCHEMA.getType('Beet'), isObjectType);

const beetFields = BEET_TYPE.getFields();

export const BEET_FIELDS = {
  name: assertNotUndefined(beetFields.name),
  weight: assertNotUndefined(beetFields.weight),
  friends: assertNotUndefined(beetFields.friends)
};

type GraphQLTypePredicate<T> = (thing: any) => thing is T;

function ensureType<T>(thing: any, predicate: GraphQLTypePredicate<T>): T {
  if (!predicate(thing)) {
    throw new Error(`Expected ${predicate.name}(${thing}) to be true!`);
  }
  return thing;
}
