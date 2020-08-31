import React from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { TextualFormField } from "../forms/form-fields";
import {
  AccessDatesMutation,
  BlankAccessDatesInput,
} from "../queries/AccessDatesMutation";
import { AccessDatesInput } from "../queries/globalTypes";
import { ProgressButtons } from "../ui/buttons";
import { dateAsISO, addDays } from "../util/date-util";

import validation from "../../../common-data/access-dates-validation.json";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

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

export function getInitialState(
  accessDates: string[],
  now: Date = new Date()
): AccessDatesInput {
  const result: AccessDatesInput = {
    ...BlankAccessDatesInput,
    date1: dateAsISO(addDays(now, DEFAULT_FIRST_DATE_DAYS)),
  };
  accessDates.forEach((date, i) => {
    (result as any)[`date${i + 1}`] = date;
  });
  return result;
}

const AccessDatesPage = MiddleProgressStep((props) => {
  const minDate = dateAsISO(addDays(new Date(), MIN_DAYS));
  return (
    <Page title={li18n._(t`Access dates`)}>
      <div>
        <h1 className="title is-4 is-spaced"><Trans>Landlord/super access dates</Trans></h1>
        <p className="subtitle is-6">
          <Trans>Access dates are times you know when you will be home for the landlord
          to schedule repairs. Please provide <strong>1 - 3</strong> access
          dates when you can be available (allowing at least {MIN_DAYS_TEXT} for
          the letter to be received).</Trans>
        </p>
        <SessionUpdatingFormSubmitter
          mutation={AccessDatesMutation}
          initialState={(session) => getInitialState(session.accessDates)}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <>
              <TextualFormField
                label={li18n._(t`First access date (at least ${MIN_DAYS_TEXT} from today)`)}
                type="date"
                min={minDate}
                required
                {...ctx.fieldPropsFor("date1")}
              />
              <TextualFormField
                label={li18n._(t`Second access date (optional)`)}
                type="date"
                min={minDate}
                {...ctx.fieldPropsFor("date2")}
              />
              <TextualFormField
                label={li18n._(t`Third access date (optional)`)}
                type="date"
                min={minDate}
                {...ctx.fieldPropsFor("date3")}
              />
              <ProgressButtons
                back={props.prevStep}
                isLoading={ctx.isLoading}
              />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
});

export default AccessDatesPage;
