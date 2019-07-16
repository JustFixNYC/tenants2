import { GraphQLFetch } from "./graphql-client";
import { WithServerFormFieldErrors } from "./form-errors";

export interface FetchSimpleQuery<FormInput, FormOutput> {
  (fetch: GraphQLFetch, args: FormInput): Promise<{ output: FormOutput }>;
}

export interface FetchSimpleQueryInfo<FormInput, FormOutput> {
  graphQL: string;
  fetch: FetchSimpleQuery<FormInput, FormOutput>;
};

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
