import { GraphQLFetch } from "../graphql-client";
import { WithServerFormFieldErrors } from "./form-errors";
import { isDeepEqual } from "../util";

export interface FetchSimpleQuery<FormInput, FormOutput> {
  (fetch: GraphQLFetch, args: FormInput): Promise<{ output: FormOutput }>;
}

export interface FetchSimpleQueryInfo<FormInput, FormOutput> {
  graphQL: string;
  fetch: FetchSimpleQuery<FormInput, FormOutput>;
};

type SimpleQuerySubmitHandlerOptions<FormInput, FormOutput> = {
  /** A cache to consult that allows us to bypass the network. */
  cache: [FormInput, FormOutput][],

  /** A callback that's triggered whenever our form is submitted. */
  onSubmit: (input: FormInput) => void
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
  options?: Partial<SimpleQuerySubmitHandlerOptions<FormInput, FormOutput>>,
): (input: FormInput) => Promise<{ simpleQueryOutput: FormOutput } & WithServerFormFieldErrors> {
  const defaultOptions: SimpleQuerySubmitHandlerOptions<FormInput, FormOutput> = {
    cache: [],
    onSubmit: () => {}
  };
  const {onSubmit, cache} = Object.assign(defaultOptions, options || {});
  return async (input: FormInput) => {
    onSubmit(input);

    for (let [cachedInput, cachedOutput] of cache) {
      if (isDeepEqual(input, cachedInput)) {
        return { simpleQueryOutput: cachedOutput, errors: [] };
      }
    }

    const result = await fetchQuery(fetchImpl, input);

    return { simpleQueryOutput: result.output, errors: [] };
  };
}
