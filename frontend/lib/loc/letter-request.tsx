import React from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";

import { withAppContext, AppContextType } from "../app-context";
import { NextButton, BackButton } from "../ui/buttons";
import JustfixRoutes from "../justfix-route-info";
import {
  LetterRequestInput,
  LetterRequestMailChoice,
} from "../queries/globalTypes";
import { LetterRequestMutation } from "../queries/LetterRequestMutation";
import { Modal, BackOrUpOneDirLevel, ModalLink } from "../ui/modal";
import { HiddenFormField } from "../forms/form-fields";
import { BulmaClassName } from "../ui/bulma";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { LetterPreview } from "../static-page/letter-preview";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { isUserNycha } from "../util/nycha";

const UNKNOWN_LANDLORD = { name: "", address: "" };

export const SendConfirmModal = withAppContext(
  (props: AppContextType & { nextStep: string }) => {
    const landlord = props.session.landlordDetails || UNKNOWN_LANDLORD;

    return (
      <Modal
        title="Your Letter Is Ready To Send!"
        withHeading
        onCloseGoTo={BackOrUpOneDirLevel}
        render={(ctx) => (
          <>
            <p>
              JustFix will send this letter via USPS Certified Mail
              <sup>&reg;</sup> to{" "}
              {isUserNycha(props.session) ? "management" : "your landlord"}:
            </p>
            <address className="has-text-centered">
              {landlord.name || "UNKNOWN LANDLORD"}
              <br />
              {landlord.address || "UNKNOWN ADDRESS"}
            </address>
            <br />
            <p>
              After this step, you cannot go back to make changes. But don't
              worry, we'll explain what to do next.
            </p>
            <div className="has-text-centered">
              <FormAsButton
                mailChoice={LetterRequestMailChoice.WE_WILL_MAIL}
                label="Confirm"
                buttonClass="is-success"
                nextStep={props.nextStep}
              />
            </div>
          </>
        )}
      />
    );
  }
);

interface FormAsButtonProps {
  mailChoice: LetterRequestMailChoice;
  label: string;
  buttonClass?: BulmaClassName;
  nextStep: string;
}

function FormAsButton(props: FormAsButtonProps): JSX.Element {
  const input: LetterRequestInput = { mailChoice: props.mailChoice };

  return (
    <SessionUpdatingFormSubmitter
      mutation={LetterRequestMutation}
      formId={"button_" + props.mailChoice}
      initialState={input}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => (
        <>
          <HiddenFormField {...ctx.fieldPropsFor("mailChoice")} />
          <NextButton
            isLoading={ctx.isLoading}
            buttonClass={props.buttonClass}
            label={props.label}
          />
        </>
      )}
    </SessionUpdatingFormSubmitter>
  );
}

const LocPreview = withAppContext((props) => (
  <LetterPreview
    title="Preview of your letter of complaint"
    src={JustfixRoutes.locale.loc.letterContent.html}
  />
));

const LetterRequestPage = MiddleProgressStep(({ prevStep, nextStep }) => {
  return (
    <Page title="Review the Letter of Complaint">
      <h1 className="title is-4 is-spaced">Review the Letter of Complaint</h1>
      <p className="subtitle is-6">
        Here is a preview of the letter for you to review. It includes the
        repair issues you selected from the issue checklist.
      </p>
      <LocPreview />
      <DemoDeploymentNote>
        <p>
          This demo site <strong>will not send</strong> a real letter to your
          landlord.
        </p>
      </DemoDeploymentNote>
      <div className="has-text-centered is-grouped">
        <ModalLink
          to={JustfixRoutes.locale.loc.previewSendConfirmModal}
          className="button is-primary is-medium"
          render={() => <SendConfirmModal nextStep={nextStep} />}
        >
          Mail my letter
        </ModalLink>
        <div className="buttons jf-two-buttons jf-two-buttons--vertical">
          <BackButton
            to={prevStep}
            buttonClass="is-text"
            label="Go back and edit"
          />
          <FormAsButton
            mailChoice={LetterRequestMailChoice.USER_WILL_MAIL}
            buttonClass="is-text"
            label="I want to mail this myself."
            nextStep={nextStep}
          />
        </div>
      </div>
    </Page>
  );
});

export default LetterRequestPage;
