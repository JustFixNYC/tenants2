import React from 'react';

import Page from "../ui/page";
import { LegacyFormSubmitter } from '../forms/legacy-form-submitter';
import { ExampleMutation, BlankExampleInput, BlankSubformsExampleSubformFormSetInput } from '../queries/ExampleMutation';
import { TextualFormField, CheckboxFormField } from '../forms/form-fields';
import { NextButton } from '../ui/buttons';
import Routes from '../routes';
import { ExampleInput } from '../queries/globalTypes';
import { Modal, BackOrUpOneDirLevel, ModalLink } from '../ui/modal';
import { Formset } from '../forms/formset';
import { CurrencyFormField } from '../forms/currency-form-field';
import { ProgressiveOtherCheckboxFormField } from '../forms/other-checkbox-form-field';
import { Link } from 'react-router-dom';

const INITIAL_STATE: ExampleInput = {
  ...BlankExampleInput,
  currencyField: '15.00',
};

/* istanbul ignore next: this is tested by integration tests. */
function FormInModal(props: { onSuccessRedirect?: string }): JSX.Element {
  return (
    <Modal title="Example form in a modal" onCloseGoTo={BackOrUpOneDirLevel} render={() => <>
      <p>Here's the same form, but in a modal!</p>
      <ExampleForm onSuccessRedirect={props.onSuccessRedirect} id="in_modal" />
    </>}/>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
function ExampleForm(props: { id: string, onSuccessRedirect?: string }): JSX.Element {
  return (
    <LegacyFormSubmitter
      mutation={ExampleMutation}
      initialState={INITIAL_STATE}
      onSuccessRedirect={props.onSuccessRedirect}
      formId={props.id}
    >
      {(ctx, latestOutput) => (
        <React.Fragment>
          {latestOutput && latestOutput.response && <div className="notification is-success">
            Hooray, the form was submitted successfully and the response is "{latestOutput.response}"!
          </div>}
          {ctx.nonFieldErrors &&
           ctx.nonFieldErrors.some(nfe => nfe.code === 'CODE_NFOER') &&
           <p className="has-grey-light">
             An error with code <code>CODE_NFOER</code> is present.
           </p>}
          <TextualFormField label="Example field" {...ctx.fieldPropsFor('exampleField')} />
          <CheckboxFormField {...ctx.fieldPropsFor('boolField')}>
            Example boolean field
          </CheckboxFormField>
          <ProgressiveOtherCheckboxFormField {...ctx.fieldPropsFor('exampleOtherField')}
            baselineLabel="If you have anything else to report, please specify it."
            enhancedLabel="Please specify."
          />
          <CurrencyFormField label="Example currency field" {...ctx.fieldPropsFor('currencyField')}/>
          <Formset {...ctx.formsetPropsFor('subforms')} emptyForm={BlankSubformsExampleSubformFormSetInput}>
            {(subforms, i) => (
              <TextualFormField label={`example subform field #${i + 1}`} {...subforms.fieldPropsFor('exampleField')} />
            )}
          </Formset>
          <div className="field">
            <NextButton isLoading={ctx.isLoading} label="Submit" />
          </div>
        </React.Fragment>
      )}
    </LegacyFormSubmitter>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
export function ExampleFormPage(): JSX.Element {
  return (
    <Page title="Example form page">
      <div className="content">
        <p>This is an example form page. It will redirect to the homepage on success; use the <Link to={Routes.dev.examples.formWithoutRedirect}>form without redirect</Link> if you want different behavior.</p>
        <ModalLink to={Routes.dev.examples.formInModal} render={() => <FormInModal onSuccessRedirect={Routes.dev.examples.form} />} className="button is-light">
          Use the form in a modal
        </ModalLink>
      </div>
      <ExampleForm onSuccessRedirect={Routes.locale.home} id="not_in_modal" />
    </Page>
  );
}

/* istanbul ignore next: this is tested by integration tests. */
export function ExampleFormWithoutRedirectPage(): JSX.Element {
  return (
    <Page title="Example form page (without redirect on success)">
      <div className="content">
        <p>This is an example form page. It will not redirect anywhere on success; ; use the <Link to={Routes.dev.examples.form}>form with redirect</Link> if you want different behavior.</p>
        <ModalLink to={Routes.dev.examples.formInModalWithoutRedirect} render={() => <FormInModal />} className="button is-light">
          Use the form in a modal
        </ModalLink>
      </div>
      <ExampleForm id="not_in_modal" />
    </Page>
  );
}
