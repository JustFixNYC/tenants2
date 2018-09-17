import React from 'react';

import Page from "../page";
import { LegacyFormSubmitter } from '../forms';
import { ExampleMutation } from '../queries/ExampleMutation';
import { TextualFormField, CheckboxFormField } from '../form-fields';
import { NextButton } from '../buttons';
import Routes from '../routes';
import { ExampleInput } from '../queries/globalTypes';

const INITIAL_STATE: ExampleInput = {
  exampleField: '',
  boolField: false
};

/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleFormPage(): JSX.Element {
  return (
    <Page title="Example form page">
      This is an example form page.
      <LegacyFormSubmitter
        mutation={ExampleMutation}
        initialState={INITIAL_STATE}
        onSuccessRedirect={Routes.home}
      >
        {(ctx) => (
          <React.Fragment>
            <TextualFormField label="Example field" {...ctx.fieldPropsFor('exampleField')} />
            <CheckboxFormField {...ctx.fieldPropsFor('boolField')}>
              Example boolean field
            </CheckboxFormField>
            <div className="field">
              <NextButton isLoading={ctx.isLoading} label="Submit" />
            </div>
          </React.Fragment>
        )}
      </LegacyFormSubmitter>
    </Page>
  );
}
