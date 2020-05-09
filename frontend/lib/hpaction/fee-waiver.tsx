import React from "react";

import { FeeWaiverExpensesInput } from "../queries/globalTypes";
import Page from "../ui/page";
import { CheckboxFormField } from "../forms/form-fields";
import { YesNoRadiosFormField } from "../forms/yes-no-radios-form-field";
import { BackButton, CenteredPrimaryButtonLink } from "../ui/buttons";
import { CurrencyFormField } from "../forms/currency-form-field";
import { FeeWaiverMiscMutation } from "../queries/FeeWaiverMiscMutation";
import { FeeWaiverIncomeMutation } from "../queries/FeeWaiverIncomeMutation";
import {
  FeeWaiverExpensesMutation,
  BlankFeeWaiverExpensesInput,
} from "../queries/FeeWaiverExpensesMutation";
import { ProgressiveOtherCheckboxFormField } from "../forms/other-checkbox-form-field";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { FeeWaiverPublicAssistanceMutation } from "../queries/FeeWaiverPublicAssistanceMutation";
import { Link } from "react-router-dom";
import JustfixRoutes from "../justfix-routes";
import { bulmaClasses } from "../ui/bulma";
import { SessionStepBuilder } from "../progress/session-step-builder";

const INITIAL_EXPENSES_STATE: FeeWaiverExpensesInput = {
  ...BlankFeeWaiverExpensesInput,
  expenseUtilities: "0.00",
  expenseCable: "0.00",
  expenseChildcare: "0.00",
  expensePhone: "0.00",
  expenseOther: "0.00",
};

export const FeeWaiverStart = MiddleProgressStep((props) => (
  <Page title="Requesting not to pay any fees" withHeading className="content">
    <p>
      The court charges a $45 fee to start a case against your landlord, but we
      can create a petition for you to ask the court to waive the fee. The court
      needs some information about your finances to make their decision.
    </p>
    <p>
      <strong>Note:</strong> this information has no effect on your case and is
      only used to estimate your income and expenses to get the filing fee
      waived.
    </p>
    <CenteredPrimaryButtonLink className="is-large" to={props.nextStep}>
      Ask the court to waive the filing fee
    </CenteredPrimaryButtonLink>
    <div className="buttons jf-two-buttons jf-two-buttons--vertical">
      <BackButton to={props.prevStep} />
      <Link
        to={JustfixRoutes.locale.hp.yourLandlord}
        className={bulmaClasses("button", "is-light", "is-medium")}
      >
        Skip
      </Link>
    </div>
  </Page>
));

const stepBuilder = new SessionStepBuilder((sess) => sess.feeWaiver);

export const FeeWaiverMisc = stepBuilder.createStep({
  title: "Prior fee waivers",
  mutation: FeeWaiverMiscMutation,
  toFormInput: (feeWaiver) => feeWaiver.yesNoRadios("askedBefore").finish(),
  renderForm: (ctx) => (
    <>
      <YesNoRadiosFormField
        {...ctx.fieldPropsFor("askedBefore")}
        label="Have you asked for a fee waiver before?"
      />
    </>
  ),
});

export const FeeWaiverPublicAssistance = stepBuilder.createStep({
  title: "Public assistance",
  mutation: FeeWaiverPublicAssistanceMutation,
  toFormInput: (feeWaiver) =>
    feeWaiver.yesNoRadios("receivesPublicAssistance").finish(),
  renderForm: (ctx) => (
    <>
      <YesNoRadiosFormField
        {...ctx.fieldPropsFor("receivesPublicAssistance")}
        label="Do you receive public assistance?"
      />
    </>
  ),
});

export const FeeWaiverIncome = stepBuilder.createStep({
  title: "Your income",
  mutation: FeeWaiverIncomeMutation,
  toFormInput: (feeWaiver) => feeWaiver.finish(),
  renderForm: (ctx) => (
    <>
      <CurrencyFormField
        label="What is your monthly income?"
        {...ctx.fieldPropsFor("incomeAmountMonthly")}
      />
      <fieldset className="field">
        <legend>
          Where do you receive your income from? You can select more than one.
        </legend>
        <CheckboxFormField {...ctx.fieldPropsFor("incomeSrcEmployment")}>
          Employment
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor("incomeSrcHra")}>
          HRA
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor("incomeSrcChildSupport")}>
          Child support
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor("incomeSrcAlimony")}>
          Alimony
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor("incomeSrcSocialSecurity")}>
          Social security
        </CheckboxFormField>
        <ProgressiveOtherCheckboxFormField
          {...ctx.fieldPropsFor("incomeSrcOther")}
          baselineLabel="If you have other sources of income, please specify them."
          enhancedLabel="Please specify your other sources of income."
        />
      </fieldset>
    </>
  ),
});

export const FeeWaiverExpenses = stepBuilder.createStep({
  title: "Your expenses",
  mutation: FeeWaiverExpensesMutation,
  toFormInput: (feeWaiver) => feeWaiver.finish(),
  blankInput: INITIAL_EXPENSES_STATE,
  renderIntro: () => (
    <>
      <p>
        If you live with someone else, please put in only what{" "}
        <strong>you</strong> pay.
      </p>
    </>
  ),
  renderForm: (ctx) => (
    <>
      <CurrencyFormField
        label="How much do you pay in rent each month?"
        {...ctx.fieldPropsFor("rentAmount")}
      />
      <br />
      <h2 className="title is-5">What are your monthly expenses?</h2>
      <CurrencyFormField
        label="Utilities"
        {...ctx.fieldPropsFor("expenseUtilities")}
      />
      <CurrencyFormField
        label="Cable/TV"
        {...ctx.fieldPropsFor("expenseCable")}
      />
      <CurrencyFormField
        label="Childcare"
        {...ctx.fieldPropsFor("expenseChildcare")}
      />
      <CurrencyFormField label="Phone" {...ctx.fieldPropsFor("expensePhone")} />
      <CurrencyFormField label="Other" {...ctx.fieldPropsFor("expenseOther")} />
      <br />
    </>
  ),
});
