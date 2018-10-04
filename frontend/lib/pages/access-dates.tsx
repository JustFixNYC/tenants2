import React from 'react';

import Page from "../page";
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { TextualFormField } from '../form-fields';
import { AccessDatesMutation } from '../queries/AccessDatesMutation';
import { AccessDatesInput } from '../queries/globalTypes';
import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { dateAsISO, addDays } from '../util';

/**
 * The minimum number of days from today that the first access date
 * should be.
 */
const MIN_DAYS = 7;

export function getInitialState(accessDates: string[], now: Date = new Date()): AccessDatesInput {
  const result: AccessDatesInput = {
    date1: dateAsISO(addDays(now, MIN_DAYS)),
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
      <TextualFormField label="First access date (at least a week from today)" type="date" min={minDate} required {...ctx.fieldPropsFor('date1')} />
      <TextualFormField label="Second access date (optional)" type="date" min={minDate} {...ctx.fieldPropsFor('date2')} />
      <TextualFormField label="Third access date (optional)" type="date" min={minDate} {...ctx.fieldPropsFor('date3')} />
      <div className="buttons">
        <BackButton to={Routes.loc.issues.home} label="Back" />
        <NextButton isLoading={ctx.isLoading} />
      </div>
    </React.Fragment>
  );
}

export default function AccessDatesPage(): JSX.Element {
  return (
    <Page title="Access dates">
      <h1 className="title">Access dates</h1>
      <div className="content">
        <p>Access dates are times you know when you will be home for the landlord to schedule repairs.</p>
        <p>Please provide up to three access dates you will be available (allowing at least a week for the letter to be received).</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={AccessDatesMutation}
        initialState={(session) => getInitialState(session.accessDates)}
        onSuccessRedirect={Routes.loc.yourLandlord}
      >
        {renderForm}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
}
