import { fullyUnwrapType } from "../graphql-schema-util";
import { BEET_FIELDS } from "./util";

test("fullyUnwrapType() works", () => {
  expect(fullyUnwrapType(BEET_FIELDS.friends.type).toString()).toBe('Beet');
  expect(fullyUnwrapType(BEET_FIELDS.weight.type).toString()).toBe('Float');
});
