import React from 'react';

import Page from "../page";
import { LegacyFormSubmitter } from '../forms/legacy-form-submitter';
import { ExampleRadioMutation } from '../queries/ExampleRadioMutation';
import { ExampleRadioInput } from '../queries/globalTypes';
import { RadiosFormField } from '../forms/form-fields';
import { NextButton } from '../buttons';
import Routes from '../routes';

const INITIAL_STATE: ExampleRadioInput = {
  radioField: ''
};

/* istanbul ignore next: this is tested by integration tests. */
function ExampleRadioForm(props: {}): JSX.Element {
  return (
    <LegacyFormSubmitter
      mutation={ExampleRadioMutation}
      initialState={INITIAL_STATE}
      onSuccessRedirect={Routes.dev.home}
    >
      {(ctx) => (
        <React.Fragment>
          <RadiosFormField
            label="Radio"
            choices={[['A', 'a'], ['B', 'b']]}
            {...ctx.fieldPropsFor('radioField')}
          />
          <div className="field">
            <NextButton isLoading={ctx.isLoading} label="Submit" />
          </div>
        </React.Fragment>
      )}
    </LegacyFormSubmitter>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleRadioPage(): JSX.Element {
  return (
    <Page title="Example radio page">
      <div className="content">
        <p>This is an example radio page.</p>
        <ExampleRadioForm />
      </div>
    </Page>
  );
}
