import { t, Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { DjangoChoices } from "../../common-data";
import { MultiCheckboxFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { li18n } from "../../i18n-lingui";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { NorentSetUpcomingLetterRentPeriodsMutation } from "../../queries/NorentSetUpcomingLetterRentPeriodsMutation";
import { ProgressButtons } from "../../ui/buttons";
import Page from "../../ui/page";
import { friendlyUTCMonthAndYear } from "../../util/date-util";
import { assertNotNull } from "../../util/util";
import { NorentNotSentLetterStep } from "./step-decorators";

function getRentNonpaymentChoices(
  periods: AllSessionInfo["norentAvailableRentPeriods"]
): DjangoChoices {
  return assertNotNull(periods).map(({ paymentDate }) => [
    paymentDate,
    friendlyUTCMonthAndYear(paymentDate),
  ]);
}

export const NorentRentPeriods = NorentNotSentLetterStep((props) => {
  const { session } = useContext(AppContext);

  return (
    <Page
      title={li18n._(t`Months of rent non-payment`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>
          It's important to notify your landlord of all months when you couldn't
          pay rent, as well as any future months where you anticipate not being
          able to pay.
        </Trans>
      </p>
      <SessionUpdatingFormSubmitter
        mutation={NorentSetUpcomingLetterRentPeriodsMutation}
        initialState={(s) => ({
          rentPeriods: s.norentUpcomingLetterRentPeriods,
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <MultiCheckboxFormField
              {...ctx.fieldPropsFor("rentPeriods")}
              label={li18n._(t`Months of rent non-payment`)}
              choices={getRentNonpaymentChoices(
                session.norentAvailableRentPeriods
              )}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
