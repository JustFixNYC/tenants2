import React, { useState } from 'react';
import { QueryLoaderQuery } from "./query-loader-prefetcher";
import { QueryWithOutput, QuerystringConverter, useLatestQueryOutput, SyncQuerystringToFields, SupportedQsTypes } from "./http-get-query-util";
import { RouteComponentProps } from "react-router";
import { FormContext } from "./form-context";
import { useContext } from "react";
import { AppContext } from "./app-context";
import { createSimpleQuerySubmitHandler } from "./forms-graphql-simple-query";
import { FormSubmitter } from "./form-submitter";

export type QueryFormSubmitterProps<FormInput, FormOutput> = RouteComponentProps & {
  emptyInput: FormInput,
  emptyOutput: FormOutput,
  query: QueryLoaderQuery<FormInput, QueryWithOutput<FormOutput>>,
  onSubmit?: (input: FormInput) => void,
  children: (ctx: FormContext<FormInput>, latestInput: FormInput, latestOutput?: FormOutput) => JSX.Element,
};

export function QueryFormSubmitter<FormInput, FormOutput>(props: QueryFormSubmitterProps<SupportedQsTypes<FormInput>, FormOutput>) {
  const { emptyInput, emptyOutput, query, children } = props;
  const appCtx = useContext(AppContext);
  const qs = new QuerystringConverter(props.location.search, emptyInput);
  const initialState = qs.toFormInput();
  const [latestInput, setLatestInput] = useState(initialState);
  const [latestOutput, setLatestOutput] = useLatestQueryOutput(props, query, initialState);
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
      }}
    >
      {ctx => <>
        <SyncQuerystringToFields qs={qs} ctx={ctx} />
        {children(ctx, latestInput, ctx.isLoading ? undefined : latestOutput)}
      </>}
    </FormSubmitter>
  );
}
