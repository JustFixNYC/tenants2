import React, { useState, useEffect } from 'react';

import Page from "../page";
import { BlankDDOSuggestionsResult } from '../queries/DDOSuggestionsResult';
import { RouteComponentProps } from 'react-router';
import { getQuerystringVar } from '../querystring';
import { DataDrivenOnboardingResults } from './data-driven-onboarding';
import { KEY_ENTER } from '../key-codes';

const QUERYSTRING_VAR = 'props';

function DebugJsonPropsForm(props: {
  onSubmit: () => void,
  onChange: (value: string) => void,
  currentValue: string
}) {
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    props.onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <div className="control">
          <textarea
            name={QUERYSTRING_VAR}
            spellCheck={false}
            className="textarea jf-dev-code"
            rows={Math.max(props.currentValue.split('\n').length, 10)}
            onKeyDown={(e) => e.ctrlKey && e.keyCode == KEY_ENTER && handleSubmit(e)}
            onChange={(e) => props.onChange(e.target.value) }
            value={props.currentValue}
          />
        </div>
      </div>
      <input type="submit" value="Submit" className="button is-primary is-medium" />
    </form>
  );
}

function safeParseJson(value: string): {value: Object, err: string|null} {
  const result = {value: {}, err: null};

  if (value && value[0] == '{') {
    try {
      return {...result, value: JSON.parse(value)};
    } catch (e) {
      return {...result, err: e.toString()};
    }
  }

  return result;
}

function useDebugJsonProps<T>(router: RouteComponentProps, blankValue: T) {
  const getViewPropsStr = () => (getQuerystringVar(router, QUERYSTRING_VAR) || '').trim();
  const viewPropsStr = getViewPropsStr();
  const parsed = safeParseJson(viewPropsStr);
  const partialViewProps = parsed.value;
  const viewProps = Object.assign({}, blankValue, partialViewProps);
  const stringifiedViewProps = JSON.stringify(viewProps, null, 2);
  const [editedValue, setEditedValue] = useState(stringifiedViewProps);

  // The following deps are legacy code that seems to work okay;
  // we don't want to break it by satisfying eslint now.
  // eslint-disable-next-line
  useEffect(() => setEditedValue(getViewPropsStr() || stringifiedViewProps), [router.location]);

  return {
    editedValue,
    setEditedValue,
    viewProps,
    err: parsed.err,
    pushEditedValue() {
      router.history.push(router.location.pathname + `?${QUERYSTRING_VAR}=${encodeURIComponent(editedValue)}`)
    }
  };
}

export function ExampleDataDrivenOnboardingResults(props: RouteComponentProps) {
  const dbg = useDebugJsonProps(props, BlankDDOSuggestionsResult);
  return <Page title="DDO results debug view" className="content">
    <div className="jf-dev-panels">
      <div className="jf-dev-panel-left">
        <h2>DDO Props</h2>
        <DebugJsonPropsForm
          onSubmit={dbg.pushEditedValue}
          onChange={dbg.setEditedValue}
          currentValue={dbg.editedValue}
        />
      </div>
      <div className="jf-dev-panel-right">
        <h2>DDO Rendering</h2>
        {dbg.err
          ? <><br/><pre className="has-text-danger">{dbg.err}</pre></>
          : <div className="jf-ddo-results">
              <DataDrivenOnboardingResults {...dbg.viewProps} />
            </div>}
      </div>
    </div>
  </Page>;
}
