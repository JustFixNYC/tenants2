import { Trans } from "@lingui/macro";
import React from "react";
import { Link, Route } from "react-router-dom";
import { getGlobalAppServerInfo } from "../../app-context";
import { CheckboxView } from "../../forms/form-fields";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import { BackOrUpOneDirLevel, Modal } from "../../ui/modal";
import Page from "../../ui/page";
import { PdfLink } from "../../ui/pdf-link";
import { EvictionFreeRoutes } from "../route-info";

const SendDeclarationModal: React.FC<{
  nextStep: string;
}> = ({ nextStep }) => {
  return (
    <Modal
      title="Shall we send your declaration?"
      onCloseGoTo={BackOrUpOneDirLevel}
      withHeading
      render={(ctx) => (
        <>
          <p>
            <Trans>
              After this step, you cannot go back to make changes. But don’t
              worry, we’ll explain what to do next.
            </Trans>
          </p>
          <div className="buttons jf-two-buttons">
            <Link
              {...ctx.getLinkCloseProps()}
              className="jf-is-back-button button is-medium"
            >
              <Trans>No</Trans>
            </Link>
            <Link
              to={nextStep}
              className="button is-primary is-medium jf-is-next-button"
            >
              Next
            </Link>
          </div>
        </>
      )}
    />
  );
};

export const EvictionFreePreviewPage = MiddleProgressStep((props) => {
  return (
    <Page
      title="Your declaration is ready to send!"
      withHeading="big"
      className="content"
    >
      <p>
        Before you send your declaration, let's review what will be sent to make
        sure all the information is correct.
      </p>
      <PdfLink
        href={getGlobalAppServerInfo().previewHardshipDeclarationURL}
        label="Preview my declaration"
      />
      <p>
        These last questions make sure that you understand the limits of the
        protection granted by this form, and that you answered the previous
        questions truthfully:
      </p>
      <CheckboxView id="1">
        I understand that I must comply with all other lawful terms under my
        tenancy, lease agreement or similar contract.
      </CheckboxView>
      <CheckboxView id="2">
        I further understand that lawful fees, penalties or interest for not
        having paid rent in full or met other financial obligations as required
        by my tenancy, lease agreement or similar contract may still be charged
        or collected and may result in a monetary judgment against me.
      </CheckboxView>
      <CheckboxView id="3">
        I further understand that my landlord may be able to seek eviction after
        May 1, 2021, and that the law may provide certain protections at that
        time that are separate from those available through this declaration.
      </CheckboxView>
      <CheckboxView id="4">
        I understand I am signing and submitting this form under penalty of law.
        I know it is against the law to make a statement on this form that I
        know is false.
      </CheckboxView>
      <ProgressButtonsAsLinks
        back={props.prevStep}
        next={EvictionFreeRoutes.locale.declaration.previewSendConfirmModal}
      />
      <Route
        path={EvictionFreeRoutes.locale.declaration.previewSendConfirmModal}
        exact
        render={() => <SendDeclarationModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});
