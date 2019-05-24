import { getGlobalValidator } from "../querybuilder";

test('GraphQL should have no validation errors', () => {
  expect(getGlobalValidator().validate()).toEqual([]);
});
