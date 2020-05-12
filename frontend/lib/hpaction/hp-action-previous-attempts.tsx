import React from "react";

import { FormContext } from "../forms/form-context";
import {
  YesNoRadiosFormField,
  YES_NO_RADIOS_TRUE,
  YES_NO_RADIOS_FALSE,
} from "../forms/yes-no-radios-form-field";
import { HpActionPreviousAttemptsMutation } from "../queries/HpActionPreviousAttemptsMutation";
import { HPActionPreviousAttemptsInput } from "../queries/globalTypes";
import {
  hideByDefault,
  ConditionalYesNoRadiosFormField,
} from "../forms/conditional-form-fields";
import { Route } from "react-router";
import { Modal } from "../ui/modal";
import { Link } from "react-router-dom";
import { SessionStepBuilder } from "../progress/session-step-builder";

function renderQuestions(ctx: FormContext<HPActionPreviousAttemptsInput>) {
  const filedWith311 = ctx.fieldPropsFor("filedWith311");
  const hpdIssuedViolations = hideByDefault(
    ctx.fieldPropsFor("hpdIssuedViolations")
  );
  const thirtyDaysSince311 = hideByDefault(
    ctx.fieldPropsFor("thirtyDaysSince311")
  );
  const thirtyDaysSinceViolations = hideByDefault(
    ctx.fieldPropsFor("thirtyDaysSinceViolations")
  );

  if (filedWith311.value === YES_NO_RADIOS_TRUE) {
    hpdIssuedViolations.hidden = false;
    if (hpdIssuedViolations.value === YES_NO_RADIOS_FALSE) {
      thirtyDaysSince311.hidden = false;
    }
    if (hpdIssuedViolations.value === YES_NO_RADIOS_TRUE) {
      thirtyDaysSinceViolations.hidden = false;
    }
  }

  return (
    <>
      <YesNoRadiosFormField
        {...filedWith311}
        label="Have you filed any complaints with 311 already?"
      />
      <ConditionalYesNoRadiosFormField
        {...hpdIssuedViolations}
        label="Did HPD issue any Violations?"
      />
      <ConditionalYesNoRadiosFormField
        {...thirtyDaysSince311}
        label="Have 30 days passed since you filed the complaints?"
      />
      <ConditionalYesNoRadiosFormField
        {...thirtyDaysSinceViolations}
        label="Have 30 days passed since the Violations were issued?"
      />
    </>
  );
}

function ModalFor311(props: { nextStep: string }) {
  return (
    <Modal
      title="311 is an important tool"
      withHeading
      onCloseGoTo={props.nextStep}
    >
      <p>
        311 complaints are an important tool to help you strengthen your case.
        You can still file complaints by calling 311 to let the city know what’s
        going on.
      </p>
      <div className="has-text-centered">
        <Link to={props.nextStep} className="button is-primary is-medium">
          Got it
        </Link>
      </div>
    </Modal>
  );
}

const stepBuilder = new SessionStepBuilder((sess) => sess.hpActionDetails);

export const createHPActionPreviousAttempts = (
  getModalRoutes: () => {
    prevAttempts311Modal: string;
  }
) =>
  stepBuilder.createStep(HpActionPreviousAttemptsMutation, (props) => ({
    title: "Previous attempts to get help",
    toFormInput: (hp) =>
      hp
        .yesNoRadios(
          "filedWith311",
          "thirtyDaysSince311",
          "hpdIssuedViolations",
          "thirtyDaysSinceViolations",
          "urgentAndDangerous"
        )
        .finish(),
    onSuccessRedirect: (_, input) =>
      input.filedWith311 === YES_NO_RADIOS_FALSE &&
      getModalRoutes().prevAttempts311Modal,
    renderIntro: () => (
      <>
        <p>
          It is important for the court to know if you have already tried to get
          help from the city to resolve your issues.
        </p>
        <Route
          path={getModalRoutes().prevAttempts311Modal}
          render={() => <ModalFor311 {...props} />}
        />
      </>
    ),
    renderForm: renderQuestions,
  }));
