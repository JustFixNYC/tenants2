import { GraphQLFetch } from "./graphql-client";
import { WithServerFormFieldErrors } from "./form-errors";

export interface FetchSimpleQuery<FormInput, FormOutput> {
  (fetch: GraphQLFetch, args: FormInput): Promise<{ output: FormOutput }>;
}

export interface FetchSimpleQueryInfo<FormInput, FormOutput> {
  graphQL: string;
  fetch: FetchSimpleQuery<FormInput, FormOutput>;
};

/**
 * A "simple query" is a GraphQL query that has any kind of input
 * arguments, and whose primary response is aliased to the key "output".
 * 
 * However, our form infrastructure expects there to be server-side
 * validation error information in a GraphQL response. So this function
 * returns a function that adds the necessary metadata to indicate
 * that no validation errors occurred.
 */
export function createSimpleQuerySubmitHandler<FormInput, FormOutput>(
  fetchImpl: GraphQLFetch,
  fetchQuery: FetchSimpleQuery<FormInput, FormOutput>,
  onSubmit?: (input: FormInput) => void
): (input: FormInput) => Promise<{ simpleQueryOutput: FormOutput } & WithServerFormFieldErrors> {
  return async (input: FormInput) => {
    if (onSubmit) onSubmit(input);
    const result = await fetchQuery(fetchImpl, input);

    return { simpleQueryOutput: result.output, errors: [] };
  };
}
