import React from 'react';

import Page from "../page";
import { LegacyFormSubmitter } from '../forms';
import { ExamplesMutation } from '../queries/ExamplesMutation';
import { TextualFormField, CheckboxFormField } from '../form-fields';
import { NextButton } from '../buttons';
import Routes from '../routes';
import { ExamplesInput } from '../queries/globalTypes';

const INITIAL_STATE: ExamplesInput = {
  items: [{
    exampleField: '',
    boolField: false
  }, {
    exampleField: '',
    boolField: false
  }]
};

/* istanbul ignore next: this is tested by integration tests. */
function ExampleFormset(props: { id: string, onSuccessRedirect: string }): JSX.Element {
  return (
    <LegacyFormSubmitter
      mutation={ExamplesMutation}
      initialState={INITIAL_STATE}
      onSuccessRedirect={props.onSuccessRedirect}
      formId={props.id}
    >
      {(formsetCtx) => (
        <React.Fragment>
          {formsetCtx.mapFormsetItems('items', (ctx) => <>
            <TextualFormField label="Example field" {...ctx.fieldPropsFor('exampleField')} />
            <CheckboxFormField {...ctx.fieldPropsFor('boolField')}>
              Example boolean field
            </CheckboxFormField>
          </>)}
          <div className="field">
            <NextButton isLoading={formsetCtx.isLoading} label="Submit" />
          </div>
        </React.Fragment>
      )}
    </LegacyFormSubmitter>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleFormsetPage(): JSX.Element {
  return (
    <Page title="Example formset page">
      <div className="content">
        <p>This is an example formset page.</p>
      </div>
      <ExampleFormset onSuccessRedirect={Routes.home} id="not_in_modal" />
    </Page>
  );
}
