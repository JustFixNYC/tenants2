import { WithServerFormFieldErrors } from "./form-errors";
import { GraphQLFetch } from "../networking/graphql-client";

/**
 * A callable that takes a GraphQL fetch implementation, some
 * form input, and returns the response from the server.
 */
export interface FetchMutation<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> {
  (fetch: GraphQLFetch, args: { input: FormInput }): Promise<{
    output: FormOutput;
  }>;
}

/**
 * An interface that encapsulates how to submit a particular form
 * via GraphQL.
 */
export interface FetchMutationInfo<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
> {
  /** The literal GraphQL of the form submission. */
  graphQL: string;

  /** A name for the mutation, for analytics/debugging purposes. */
  name: string;

  /**
   * The callable that can perform the form submission, given a
   * GraphQL implementation.
   */
  fetch: FetchMutation<FormInput, FormOutput>;
}

/**
 * This wraps a mutation in a submit handler, for use with the forms API.
 *
 * It assumes the mutation follows a certain convention: that its input is
 * called "input", and that its output is aliased as "output".
 *
 * @param fetchImpl The GraphQL fetch implementation, that does the actual fetching.
 * @param fetchMutation The function that issues the mutation (created by querybuilder).
 */
export function createMutationSubmitHandler<
  FormInput,
  FormOutput extends WithServerFormFieldErrors
>(
  fetchImpl: GraphQLFetch,
  fetchMutation: FetchMutation<FormInput, FormOutput>
): (input: FormInput) => Promise<FormOutput> {
  return (input: FormInput) => {
    const promise = fetchMutation(fetchImpl, { input });

    return promise.then((result) => result.output);
  };
}
