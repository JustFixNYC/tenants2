import React, { useContext, useState, useEffect } from 'react';
import { RouteComponentProps, Switch, Route, Redirect } from "react-router";
import Page from '../page';
import Routes from '../routes';
import { FormSubmitter } from '../form-submitter';
import { AppContext } from '../app-context';
import { DataRequestMultiLandlordQuery, DataRequestMultiLandlordQuery_output, DataRequestMultiLandlordQueryVariables } from '../queries/DataRequestMultiLandlordQuery';
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
  output: DataRequestMultiLandlordQuery_output|null
};

function getColumnValue(name: string, value: string): JSX.Element|string {
  if (name.toLowerCase() === 'bbl') {
    return <a href={`https://whoownswhat.justfix.nyc/bbl/${value}`} target="_blank" rel="noopener noreferrer">
      {value}
    </a>
  } else if (name === 'error') {
    return <span className="has-text-danger" style={{fontFamily: 'monospace', whiteSpace: 'pre'}}>{value}</span>
  }
  return value;
}

function SearchResults({ output, query }: SearchResultsProps) {
  const queryFrag = <>&ldquo;{query}&rdquo;</>;
  let content = null;

  if (query && output) {
    const lines: string[][] = JSON.parse(output.snippetRows);
    const header = lines[0];
    const rows = lines.slice(1);
    const mightBeTruncated = rows.length === output.snippetMaxRows;
    const downloadProps = {href: output.csvUrl, download: 'multi-landlord.csv'};

    content = <>
      <h3>Query results for {queryFrag}</h3>
      <p><a {...downloadProps} className="button">Download CSV</a></p>
      {mightBeTruncated
        ? <p>Only the first {output.snippetMaxRows} rows are shown. Please <a {...downloadProps}>download the CSV</a> for the full dataset.</p>
        : <p>{rows.length} result{rows.length > 1 && 's'} found.</p>
      }
      <div style={{maxWidth: '100%', overflowX: 'scroll'}}>
        <table className="table">
          <thead>
            <tr>
              {header.map((heading, i) => <th key={i}>{heading}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((column, i) => <td key={i}>{getColumnValue(header[i], column)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>;
  } else if (query) {
    content = <p>No results for {queryFrag}.</p>;
  }

  return (
    <div className="content">
      <br/>
      {content}
    </div>
  );
}

function useLatestResults(
  router: RouteComponentProps,
  initialState: DataRequestMultiLandlordQueryVariables,
  query: string
) {
  const appCtx = useContext(AppContext);
  let initialResults: SearchResultsProps = { query: '', output: null };
  const qlp = new QueryLoaderPrefetcher(router, appCtx, DataRequestMultiLandlordQuery, initialState);

  qlp.maybeQueueForPrefetching();

  if (qlp.prefetchedResponse) {
    const { output } = qlp.prefetchedResponse;
    initialResults = { query, output };
  }

  return useState(initialResults);
}

function MultiLandlordPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const currentQuery = getQuerystringVar(props, QUERYSTRING_VAR) || '';
  const initialState = {landlords: currentQuery};
  const [latestResults, setLatestResults] = useLatestResults(props, initialState, currentQuery);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataRequestMultiLandlordQuery.fetch, input => {
    setLatestResults({ query: input.landlords, output: null });
    maybePushHistory(props, QUERYSTRING_VAR, input.landlords);
  });

  return <Page title="Multi-landlord data request" withHeading>
    <FormSubmitter
      initialState={initialState}
      onSubmit={onSubmit}
      onSuccess={output => setLatestResults({ ...latestResults, output: output.simpleQueryOutput })}
    >
      {ctx => <>
        <SyncFieldWithQuerystring currentQuery={currentQuery} field={ctx.fieldPropsFor(QUERYSTRING_VAR)} ctx={ctx} />
        <TextualFormField {...ctx.fieldPropsFor(QUERYSTRING_VAR)} label="Landlords (comma-separated)" />
        <NextButton label="Request data" isLoading={ctx.isLoading} />
        {!ctx.isLoading && <SearchResults {...latestResults} />}
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
