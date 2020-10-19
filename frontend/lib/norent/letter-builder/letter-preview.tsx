import React, { useContext, useState } from "react";
import Page from "../../ui/page";
import { LetterPreview } from "../../static-page/letter-preview";
import { NorentRoutes } from "../routes";
import { NextButton, ProgressButtonsAsLinks } from "../../ui/buttons";
import { OutboundLink } from "../../analytics/google-analytics";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { Route, Link, Redirect } from "react-router-dom";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { AppContext } from "../../app-context";
import {
  NorentLetterEmailToLandlordForUser,
  NorentLetterTranslation,
} from "../letter-content";
import { NorentNotSentLetterStep } from "./step-decorators";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import {
  ForeignLanguageOnly,
  InYourLanguageTranslation,
} from "../../ui/cross-language";
import { NorentSendLetterV2Mutation } from "../../queries/NorentSendLetterV2Mutation";

const SendLetterModal: React.FC<{
  nextStep: string;
}> = ({ nextStep }) => {
  return (
    <Modal
      title={li18n._(t`Shall we send your letter?`)}
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
          <SessionUpdatingFormSubmitter
            mutation={NorentSendLetterV2Mutation}
            initialState={{}}
            onSuccessRedirect={nextStep}
          >
            {(sessionCtx) => (
              <div className="buttons jf-two-buttons">
                <Link
                  {...ctx.getLinkCloseProps()}
                  className="jf-is-back-button button is-medium"
                >
                  <Trans>No</Trans>
                </Link>
                <NextButton
                  isLoading={sessionCtx.isLoading}
                  label={li18n._(t`Yes`)}
                />
              </div>
            )}
          </SessionUpdatingFormSubmitter>
        </>
      )}
    />
  );
};

const Microcopy: React.FC<{ children: React.ReactNode }> = (props) => (
  <p className="is-uppercase is-size-7">{props.children}</p>
);

const InYourLanguageMicrocopy: React.FC<{
  additionalContent?: JSX.Element;
}> = (props) => (
  <Microcopy>
    <InYourLanguageTranslation />
    {props.additionalContent && <> {props.additionalContent}</>}
  </Microcopy>
);

export const NorentLetterPreviewPage = NorentNotSentLetterStep((props) => {
  const { letterContent } = NorentRoutes.getLocale("en");
  const { session } = useContext(AppContext);
  const isMailingLetter = session.landlordDetails?.address;
  const isEmailingLetter = session.landlordDetails?.email;

  // Urg, we need to capture the value of this at the time our component
  // mounts, since it will change as soon as the user submits the
  // form on this page.
  const rentPeriodsAtMount = useState(
    session.norentUpcomingLetterRentPeriods
  )[0];

  if (rentPeriodsAtMount.length === 0) {
    // This will be the case if the user e.g. clicks their browser's
    // "back" button from the confirmation page.
    return <Redirect to={NorentRoutes.locale.letter.menu} push={false} />;
  }

  return (
    <Page
      title={li18n._(t`Your Letter Is Ready To Send!`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>
          Before you send your letter, let's review what will be sent to make
          sure all the information is correct.
        </Trans>
      </p>
      <>
        <p>
          {isEmailingLetter && !isMailingLetter ? (
            <Trans>
              Here's a preview of the letter that will be attached in an email
              to your landlord:
            </Trans>
          ) : (
            <Trans>Here's a preview of the letter:</Trans>
          )}
        </p>
        <ForeignLanguageOnly>
          <InYourLanguageMicrocopy />
          <NorentLetterTranslation />
          <Microcopy>
            <Trans>English version</Trans>
          </Microcopy>
        </ForeignLanguageOnly>
        <LetterPreview
          title={li18n._(t`Preview of your NoRent.org letter`)}
          src={letterContent.html}
        />
        <p>
          <OutboundLink href={letterContent.pdf} target="_blank">
            <Trans>View this letter as a PDF</Trans>
          </OutboundLink>
        </p>
        {isMailingLetter && (
          <p>
            <Trans>
              We will be mailing this letter on your behalf by USPS certified
              mail and will be providing a tracking number.
            </Trans>
          </p>
        )}
      </>
      <br />
      {isEmailingLetter && (
        <>
          <p>
            <Trans>
              Here’s a preview of the email that will be sent on your behalf:
            </Trans>
          </p>
          <ForeignLanguageOnly>
            <InYourLanguageMicrocopy
              additionalContent={
                <Trans>(the email will be sent in English)</Trans>
              }
            />
          </ForeignLanguageOnly>
          <article className="message">
            <div className="message-header has-text-weight-normal">
              <Trans>To:</Trans> {session.landlordDetails?.name}{" "}
              {session.landlordDetails?.email &&
                `<${session.landlordDetails?.email}>`}
            </div>
            <div className="message-body has-background-grey-lighter has-text-left has-text-weight-light">
              <NorentLetterEmailToLandlordForUser />
            </div>
          </article>
        </>
      )}
      <p>
        <Trans>Make sure all the information above is correct.</Trans>
      </p>
      <ProgressButtonsAsLinks
        back={props.prevStep}
        next={NorentRoutes.locale.letter.previewSendConfirmModal}
      />
      <Route
        path={NorentRoutes.locale.letter.previewSendConfirmModal}
        exact
        render={() => <SendLetterModal nextStep={props.nextStep} />}
      />
    </Page>
  );
});
