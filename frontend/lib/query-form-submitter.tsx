import React, { useState, useCallback } from 'react';
import { QueryLoaderQuery } from "./query-loader-prefetcher";
import { QueryWithOutput, QuerystringConverter, useLatestQueryOutput, SyncQuerystringToFields, SupportedQsTypes } from "./http-get-query-util";
import { RouteComponentProps } from "react-router";
import { FormContext } from "./form-context";
import { useContext } from "react";
import { AppContext } from "./app-context";
import { createSimpleQuerySubmitHandler } from "./forms-graphql-simple-query";
import { FormSubmitter } from "./form-submitter";

/**
 * This function type is responsible for rendering the form's fields.
 * 
 * @param ctx The form context.
 * @param latestInput The latest input that was provided when the form was last submitted.
 * @param latestOutput The output of the last form submission.
 */
type QueryFormContextRenderer<FormInput, FormOutput> = 
  (ctx: FormContext<FormInput>, latestInput: FormInput, latestOutput?: FormOutput) => JSX.Element;

export type QueryFormSubmitterProps<FormInput, FormOutput> = RouteComponentProps & {
  /** Object representing empty/default input for the form. */
  emptyInput: FormInput,

  /** Object representing what we know will be returned if empty/default input is submitted. */
  emptyOutput: FormOutput,

  /** The query to execute when the user submits the form. */
  query: QueryLoaderQuery<FormInput, QueryWithOutput<FormOutput>>,

  /** An optional callback to call when the user submits the form. */
  onSubmit?: (input: FormInput) => void,

  /** The function that renders the actual form. */
  children: QueryFormContextRenderer<FormInput, FormOutput>,
};

/**
 * A form submitter for HTTP GET-style requests, where the form input may be
 * specified in the URL querystring, and where the output is displayed on the
 * same page as the form.
 * 
 * This submitter attempts to pre-fetch the results during server-side rendering,
 * ensuring both quick initial page loads and baseline functionality that works
 * without requiring JavaScript.
 */
export function QueryFormSubmitter<FormInput, FormOutput>(props: QueryFormSubmitterProps<SupportedQsTypes<FormInput>, FormOutput>) {
  const { emptyInput, emptyOutput, query, children } = props;
  const appCtx = useContext(AppContext);
  const qs = new QuerystringConverter(props.location.search, emptyInput);
  const initialState = qs.toFormInput();
  const [latestInput, setLatestInput] = useState(initialState);
  const [latestOutput, setLatestOutput] = useLatestQueryOutput(props, query, initialState);
  const [shouldFocus, setShouldFocus] = useState(false);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, query.fetch, {
    cache: [[emptyInput, emptyOutput]],
    onSubmit(input) {
      setLatestInput(input);
      if (props.onSubmit) props.onSubmit(input);
      qs.maybePushToHistory(input, props);
    }
  });

  return (
    <FormSubmitter
      submitOnMount={latestOutput === undefined}
      initialState={initialState}
      onSubmit={onSubmit}
      onSuccess={output => {
        setLatestOutput(output.simpleQueryOutput);
        setShouldFocus(true);
      }}
    >
      {ctx => <>
        <SyncQuerystringToFields qs={qs} ctx={ctx} />
        <QueryFormResultsContext.Provider value={{
          shouldFocus,
          onFocus() { setShouldFocus(false) }
        }}>
          {children(ctx, latestInput, ctx.isLoading ? undefined : latestOutput)}
        </QueryFormResultsContext.Provider>
      </>}
    </FormSubmitter>
  );
}

/**
 * A private context for transferring information about whether query form
 * results need to be focused for accessibility purposes.
 */
const QueryFormResultsContext = React.createContext<QueryFormResultsContextType>({
  shouldFocus: false,
  onFocus: () => {}
});

type QueryFormResultsContextType = {
  /** Whether the form results need to be focused for accessibilty purposes. */
  shouldFocus: boolean,
  
  /** Callback for the focus target to call once it's focused itself in the DOM. */
  onFocus: () => void
};

/**
 * This React Hook returns props for an HTML element that will ensure that it
 * is focused in the context of a progressively-enhanced form submission,
 * improving keyboard and screen reader accessibility.
 */
export function useQueryFormResultFocusProps(): {
  tabIndex: number,
  ref: (node: HTMLElement|null) => void
} {
  const ctx = useContext(QueryFormResultsContext);

  return {
    tabIndex: -1,
    ref: useCallback(node => {
      if (node && ctx.shouldFocus) {
        node.focus();
        ctx.onFocus();
      }
    }, [])
  };
}
