import React, { useContext, useState, useEffect } from 'react';
import { RouteComponentProps, Switch, Route, Redirect } from "react-router";
import Page from '../page';
import Routes from '../routes';
import { FormSubmitter } from '../form-submitter';
import { AppContext } from '../app-context';
import { DataRequestMultiLandlordQuery } from '../queries/DataRequestMultiLandlordQuery';
import { TextualFormField, BaseFormFieldProps } from '../form-fields';
import { NextButton } from '../buttons';
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';
import { getQuerystringVar } from '../querystring';
import { FormContext } from '../form-context';
import { QueryLoaderPrefetcher } from '../query-loader-prefetcher';

const QUERYSTRING_VAR = 'landlords';

function SyncFieldWithQuerystring(props: {
  currentQuery: string,
  field: BaseFormFieldProps<string>,
  ctx: FormContext<any>
}) {
  const [triggeredChange, setTriggeredChange] = useState(false);

  // This effect detects when the current query in our URL has changed,
  // and matches our search field to sync with it.
  useEffect(() => {
    if (props.field.value !== props.currentQuery) {
      props.field.onChange(props.currentQuery);
      setTriggeredChange(true);
    }
  }, [props.currentQuery]);

  // This effect detects when our search field has caught up with our
  // URL change, and immediately triggers a form submission.
  useEffect(() => {
    if (triggeredChange && props.field.value === props.currentQuery) {
      props.ctx.submit(true);
      setTriggeredChange(false);
    }
  }, [props.field.value]);

  return null;
}

function maybePushHistory(router: RouteComponentProps, varName: string, newValue: string) {
  const currentValue = getQuerystringVar(router, varName) || '';
  if (currentValue !== newValue) {
    router.history.push(router.location.pathname + `?${varName}=${encodeURIComponent(newValue)}`);
  }
}

type SearchResultsProps = {
  query: string,
  csvSnippet: string
};

function SearchResults({ csvSnippet, query }: SearchResultsProps) {
  const queryFrag = <>&ldquo;{query}&rdquo;</>;

  return (
    <div className="content">
      <br/>
      {csvSnippet ? <>
        <h3>Query results for {queryFrag}</h3>
        <pre>{csvSnippet}</pre>
      </> : (query && <p>No results for {queryFrag}.</p>)}
    </div>
  );
}

function MultiLandlordPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const currentQuery = getQuerystringVar(props, QUERYSTRING_VAR) || '';
  const initialState = {landlords: currentQuery};
  let initialSnippet = '';
  let initialLastSearch = '';

  if (currentQuery) {
    const qlp = new QueryLoaderPrefetcher(props, appCtx, DataRequestMultiLandlordQuery, initialState);
    qlp.maybeQueueForPrefetching();
    if (qlp.prefetchedResponse) {
      const { output } = qlp.prefetchedResponse;
      initialLastSearch = currentQuery;
      initialSnippet = output ? output.csvSnippet : '';
    }
  }

  const [snippet, setSnippet] = useState(initialSnippet);
  const [lastSearch, setLastSearch] = useState(initialLastSearch);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataRequestMultiLandlordQuery.fetch, input => {
    setLastSearch(input.landlords);
    maybePushHistory(props, QUERYSTRING_VAR, input.landlords);
  });

  return <Page title="Multi-landlord data request" withHeading>
    <FormSubmitter
      initialState={initialState}
      onSubmit={onSubmit}
      onSuccess={output => {
        const { simpleQueryOutput } = output;
        simpleQueryOutput ? setSnippet(simpleQueryOutput.csvSnippet) : setSnippet('')
      }}
    >
      {ctx => <>
        <SyncFieldWithQuerystring currentQuery={currentQuery} field={ctx.fieldPropsFor(QUERYSTRING_VAR)} ctx={ctx} />
        <TextualFormField {...ctx.fieldPropsFor(QUERYSTRING_VAR)} label="Landlords (comma-separated)" />
        <NextButton label="Request data" isLoading={ctx.isLoading} />
        {!ctx.isLoading && <SearchResults query={lastSearch} csvSnippet={snippet} />}
      </>}
    </FormSubmitter>
  </Page>;
}

export default function DataRequestsRoutes(): JSX.Element {
  return <Switch>
    <Route path={Routes.locale.dataRequests.home} exact>
      <Redirect to={Routes.locale.dataRequests.multiLandlord} />
    </Route>
    <Route path={Routes.locale.dataRequests.multiLandlord} exact component={MultiLandlordPage} />
  </Switch>;
}
