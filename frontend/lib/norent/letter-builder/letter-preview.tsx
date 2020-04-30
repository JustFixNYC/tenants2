import React, { useContext } from "react";
import Page from "../../ui/page";
import { LetterPreview } from "../../static-page/letter-preview";
import { NorentRoutes } from "../routes";
import { NextButton, BackButton } from "../../ui/buttons";
import { OutboundLink } from "../../analytics/google-analytics";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentSendLetterMutation } from "../../queries/NorentSendLetterMutation";
import { Route, Link } from "react-router-dom";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { AppContext } from "../../app-context";
import { NorentLetterEmailToLandlordForUser } from "../letter-content";
import { NorentNotSentLetterStep } from "./step-decorators";

const SendLetterModal: React.FC<{
  nextStep: string;
}> = ({ nextStep }) => {
  return (
    <Modal
      title="Shall we send your letter?"
      onCloseGoTo={BackOrUpOneDirLevel}
      withHeading
      render={(ctx) => (
        <>
          <p>
            After this step, you cannot go back to make changes. But don’t
            worry, we’ll explain what to do next.
          </p>
          <SessionUpdatingFormSubmitter
            mutation={NorentSendLetterMutation}
            initialState={{}}
            onSuccessRedirect={nextStep}
          >
            {(sessionCtx) => (
              <div className="buttons jf-two-buttons">
                <Link
                  {...ctx.getLinkCloseProps()}
                  className="jf-is-back-button button is-medium"
                >
                  No
                </Link>
                <NextButton isLoading={sessionCtx.isLoading} label="Yes" />
              </div>
            )}
          </SessionUpdatingFormSubmitter>
        </>
      )}
    />
  );
};

export const NorentLetterPreviewPage = NorentNotSentLetterStep((props) => {
  const { letterContent } = NorentRoutes.locale;
  const { session } = useContext(AppContext);
  const isMailingLetter = session.landlordDetails?.address;
  const isEmailingLetter = session.landlordDetails?.email;
  return (
    <Page
      title="Your Letter Is Ready To Send!"
      withHeading="big"
      className="content"
    >
      <p>
        Before you send your letter, let's review what will be sent to make sure
        all the information is correct.
      </p>
      <>
        <p>
          Here's a preview of the letter
          {isEmailingLetter &&
            !isMailingLetter &&
            " that will be attached in an email to your landlord"}
          :
        </p>
        <LetterPreview
          title="Preview of your NoRent.org letter"
          src={letterContent.html}
        />
        <p>
          <OutboundLink href={letterContent.pdf} target="_blank">
            View this letter as a PDF
          </OutboundLink>
        </p>
        {isMailingLetter && (
          <p>
            We will be mailing this letter on your behalf by USPS certified mail
            and will be providing a tracking number.
          </p>
        )}
      </>
      <br />
      {isEmailingLetter && (
        <>
          <p>Here’s a preview of the email that will be sent on your behalf:</p>
          <article className="message jf-email-preview">
            <div className="message-header has-text-weight-normal">
              To: {session.landlordDetails?.name}{" "}
              {session.landlordDetails?.email &&
                `<${session.landlordDetails?.email}>`}
            </div>
            <div className="message-body has-background-grey-lighter has-text-left has-text-weight-light">
              <NorentLetterEmailToLandlordForUser />
            </div>
          </article>
        </>
      )}
      <p>Make sure all the information above is correct.</p>
      <div className="buttons jf-two-buttons">
        <BackButton to={props.prevStep} />
        <Link
          to={NorentRoutes.locale.letter.previewSendConfirmModal}
          className="button is-primary is-medium jf-is-next-button"
        >
          Send letter
        </Link>
      </div>
      <Route
        path={NorentRoutes.locale.letter.previewSendConfirmModal}
        exact
        render={() => <SendLetterModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});
