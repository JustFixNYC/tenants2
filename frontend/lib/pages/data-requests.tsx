import React, { useContext, useState } from 'react';
import { RouteComponentProps, Switch, Route, Redirect } from "react-router";
import Page from '../page';
import Routes from '../routes';
import { FormSubmitter } from '../form-submitter';
import { AppContext } from '../app-context';
import { DataRequestMultiLandlordQuery, DataRequestMultiLandlordQuery_output } from '../queries/DataRequestMultiLandlordQuery';
import { TextualFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';
import { useLatestQueryOutput, maybePushQueryInputToHistory, SyncQuerystringToFields, getInitialQueryInputFromQs } from '../tests/http-get-query-util';

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

function MultiLandlordPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const defaultState = { landlords: '' };
  const initialState = getInitialQueryInputFromQs(props, defaultState);
  const [latestResults, setLatestResults] = useLatestQueryOutput(props, DataRequestMultiLandlordQuery, initialState);
  const [latestQuery, setLatestQuery] = useState(initialState.landlords);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataRequestMultiLandlordQuery.fetch, input => {
    setLatestResults(null);
    setLatestQuery(input.landlords);
    maybePushQueryInputToHistory(props, input);
  });

  return <Page title="Multi-landlord data request" withHeading>
    <FormSubmitter
      initialState={initialState}
      onSubmit={onSubmit}
      onSuccess={output => setLatestResults(output && output.simpleQueryOutput) }
    >
      {ctx => <>
        <SyncQuerystringToFields router={props} fields={[
          ctx.fieldPropsFor('landlords'),
        ]} ctx={ctx} />
        <TextualFormField {...ctx.fieldPropsFor('landlords')} label="Landlords (comma-separated)" />
        <NextButton label="Request data" isLoading={ctx.isLoading} />
        {!ctx.isLoading && <SearchResults output={latestResults} query={latestQuery} />}
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
