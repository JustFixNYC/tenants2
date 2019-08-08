import React, { useState, useEffect } from 'react';

import Page from "../page";
import { BlankDDOSuggestionsResult, DDOSuggestionsResult } from '../queries/DDOSuggestionsResult';
import { RouteComponentProps } from 'react-router';
import { getQuerystringVar } from '../querystring';
import { DataDrivenOnboardingResults } from './data-driven-onboarding';

export function ExampleDataDrivenOnboardingResults(props: RouteComponentProps) {
  const getViewPropsStr = () => (getQuerystringVar(props, 'props') || '').trim();
  const viewPropsStr = getViewPropsStr();
  let partialViewProps: Partial<DDOSuggestionsResult> = {};
  let err: string|null = null;

  if (viewPropsStr) {
    try {
      partialViewProps = JSON.parse(viewPropsStr);
    } catch (e) {
      err = e.toString();
    }
  }

  const viewProps = Object.assign({}, BlankDDOSuggestionsResult, partialViewProps);

  const stringifiedViewProps = JSON.stringify(viewProps, null, 2);
  const [currentValue, setCurrentValue] = useState(stringifiedViewProps);

  useEffect(() => setCurrentValue(getViewPropsStr() || stringifiedViewProps), [props.location]);

  return <Page title="DDO results debug view" withHeading className="content">
    <p>This page should be used for development only!</p>
    <form onSubmit={(e) => {
      e.preventDefault();
      props.history.push(props.location.pathname + '?props=' + encodeURIComponent(currentValue));
    }}>
      <div className="field">
        <div className="control">
          <textarea style={{
            fontFamily: 'monospace',
            minHeight: '15em'
          }}
            name="props"
            spellCheck={false}
            className="textarea"
            onChange={(e) => setCurrentValue(e.target.value) }
            value={currentValue}
          />
        </div>
      </div>
      <input type="submit" value="Submit" className="button is-primary is-medium" />
    </form>
    {err
      ? <><br/><pre className="has-text-danger">{err}</pre></>
      : <div className="jf-ddo-results">
          <DataDrivenOnboardingResults {...viewProps} />
        </div>}
  </Page>;
}
