import React from 'react';

import Page from "../page";
import { LegacyFormSubmitter } from '../forms';
import { ExampleMutation } from '../queries/ExampleMutation';
import { TextualFormField, CheckboxFormField } from '../form-fields';
import { NextButton } from '../buttons';
import Routes from '../routes';
import { ExampleInput } from '../queries/globalTypes';
import { Modal, BackOrUpOneDirLevel, ModalLink } from '../modal';

const INITIAL_STATE: ExampleInput = {
  exampleField: '',
  boolField: false,
  subforms: [
//    { exampleField: '' }
  ]
};

/* istanbul ignore next: this is tested by integration tests. */
function FormInModal(): JSX.Element {
  return (
    <Modal title="Example form in a modal" onCloseGoTo={BackOrUpOneDirLevel} render={() => (
      <div className="content box">
        <p>Here's the same form, but in a modal!</p>
        <ExampleForm onSuccessRedirect={Routes.dev.examples.form} id="in_modal" />
      </div>
    )}/>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
function ExampleForm(props: { id: string, onSuccessRedirect: string }): JSX.Element {
  return (
    <LegacyFormSubmitter
      mutation={ExampleMutation}
      initialState={INITIAL_STATE}
      onSuccessRedirect={props.onSuccessRedirect}
      formId={props.id}
    >
      {(ctx) => (
        <React.Fragment>
          <TextualFormField label="Example field" {...ctx.fieldPropsFor('exampleField')} />
          <CheckboxFormField {...ctx.fieldPropsFor('boolField')}>
            Example boolean field
          </CheckboxFormField>
          {ctx.renderFormsetFor('subforms', (subforms) => (
            <TextualFormField label="example subform field" {...subforms.fieldPropsFor('exampleField')} />
          ))}
          <div className="field">
            <NextButton isLoading={ctx.isLoading} label="Submit" />
          </div>
        </React.Fragment>
      )}
    </LegacyFormSubmitter>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleFormPage(): JSX.Element {
  return (
    <Page title="Example form page">
      <div className="content">
        <p>This is an example form page.</p>
        <ModalLink to={Routes.dev.examples.formInModal} component={FormInModal} className="button is-light">
          Use the form in a modal
        </ModalLink>
      </div>
      <ExampleForm onSuccessRedirect={Routes.home} id="not_in_modal" />
    </Page>
  );
}
