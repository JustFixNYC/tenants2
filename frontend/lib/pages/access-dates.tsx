import React from 'react';

import Page from "../page";
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { TextualFormField } from '../form-fields';
import { AccessDatesMutation } from '../queries/AccessDatesMutation';
import { AccessDatesInput } from '../queries/globalTypes';
import { NextButton } from "../buttons";
import Routes from '../routes';
import { dateAsISO, addDays } from '../util';

import validation from '../../../common-data/access-dates-validation.json';
import { BackToPrevStepButton } from '../progress-elements';

/**
 * The minimum number of days from today that the first access date
 * should be.
 */
const { MIN_DAYS, MIN_DAYS_TEXT } = validation;

/**
 * The default number of days from today that we'll set the
 * first access date to when the user first sees the form.
 */
const DEFAULT_FIRST_DATE_DAYS = MIN_DAYS;

export function getInitialState(accessDates: string[], now: Date = new Date()): AccessDatesInput {
  const result: AccessDatesInput = {
    date1: dateAsISO(addDays(now, DEFAULT_FIRST_DATE_DAYS)),
    date2: '',
    date3: ''
  };
  accessDates.forEach((date, i) => {
    (result as any)[`date${i + 1}`] = date;
  });
  return result;
}

function renderForm(ctx: FormContext<AccessDatesInput>): JSX.Element {
  const minDate = dateAsISO(addDays(new Date(), MIN_DAYS));

  return (
    <React.Fragment>
      <TextualFormField label={`First access date (at least ${MIN_DAYS_TEXT} from today)`} type="date" min={minDate} required {...ctx.fieldPropsFor('date1')} />
      <TextualFormField label="Second access date (optional)" type="date" min={minDate} {...ctx.fieldPropsFor('date2')} />
      <TextualFormField label="Third access date (optional)" type="date" min={minDate} {...ctx.fieldPropsFor('date3')} />
      <div className="buttons jf-two-buttons">
        <BackToPrevStepButton label="Back" />
        <NextButton isLoading={ctx.isLoading} />
      </div>
    </React.Fragment>
  );
}

export default function AccessDatesPage(): JSX.Element {
  return (
    <Page title="Access dates">
      <div>
        <h1 className="title is-4 is-spaced">Landlord/super access dates</h1>
        <p className="subtitle is-6">Access dates are times you know when you will be home for the landlord to schedule repairs. Please provide <strong>1 - 3</strong> access dates when you can be available (allowing at least {MIN_DAYS_TEXT} for the letter to be received).</p>
        <SessionUpdatingFormSubmitter
          mutation={AccessDatesMutation}
          initialState={(session) => getInitialState(session.accessDates)}
          onSuccessRedirect={Routes.locale.loc.yourLandlord}
        >
          {renderForm}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
}
