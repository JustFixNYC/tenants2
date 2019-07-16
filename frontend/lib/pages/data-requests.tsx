import React, { useContext, useState } from 'react';
import { RouteComponentProps, Switch, Route, Redirect } from "react-router";
import Page from '../page';
import Routes from '../routes';
import { FormSubmitter } from '../form-submitter';
import { AppContext } from '../app-context';
import { DataRequestMultiLandlordQuery } from '../queries/DataRequestMultiLandlordQuery';
import { TextualFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';

function MultiLandlordPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const [snippet, setSnippet] = useState('');
  const [lastSearch, setLastSearch] = useState('');
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataRequestMultiLandlordQuery.fetch, input => {
    setLastSearch(input.landlords);
  });
  const lastSearchFragment = <>&ldquo;{lastSearch}&rdquo;</>;

  return <Page title="Multi-landlord data request" withHeading>
    <FormSubmitter
      initialState={{landlords: ""}}
      onSubmit={onSubmit}
      onSuccess={output => {
        const { simpleQueryOutput } = output;
        simpleQueryOutput ? setSnippet(simpleQueryOutput.csvSnippet) : setSnippet('')
      }}
    >
      {ctx => <>
        <TextualFormField {...ctx.fieldPropsFor('landlords')} label="Landlords (comma-separated)" />
        <NextButton label="Request data" isLoading={ctx.isLoading} />
      </>}
    </FormSubmitter>
    <br/>
    <div className="content">
      {snippet ? <>
        <h3>Query results for {lastSearchFragment}</h3>
        <pre>{snippet}</pre>
      </> : (lastSearch && <p>No results for {lastSearchFragment}.</p>)}
    </div>
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
