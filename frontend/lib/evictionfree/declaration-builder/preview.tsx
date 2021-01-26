import { t, Trans } from "@lingui/macro";
import React from "react";
import { Link, Route } from "react-router-dom";
import { getGlobalAppServerInfo } from "../../app-context";
import { CheckboxView } from "../../forms/form-fields";
import { li18n } from "../../i18n-lingui";
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
      title={li18n._(t`Shall we send your declaration?`)}
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
              <Trans>Confirm</Trans>
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
      title={li18n._(t`Your declaration is ready to send!`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>
          Before you send your hardship declaration form, let's review what will
          be sent to make sure all the information is correct.
        </Trans>
      </p>
      <PdfLink
        href={getGlobalAppServerInfo().previewHardshipDeclarationURL}
        label={li18n._(t`Preview my declaration`)}
      />
      <CheckboxView id="4">
        <Trans>
          I understand I am signing and submitting this form under penalty of
          law. I know it is against the law to make a statement on this form
          that I know is false.
        </Trans>
      </CheckboxView>
      <ProgressButtonsAsLinks
        back={props.prevStep}
        nextLabel={li18n._(t`Send`)}
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
