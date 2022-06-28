import React, { useContext } from "react";
import { Link } from "react-router-dom";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { LaLetterBuilderCreateLetterMutation } from "../../queries/LaLetterBuilderCreateLetterMutation";
import { NextButton } from "../../ui/buttons";
import { WelcomePage } from "../../common-steps/welcome";
import { AppContext } from "../../app-context";
import { OutboundLink } from "../../ui/outbound-link";
import { StaticImage } from "../../ui/static-image";
import { getLaLetterBuilderImageSrc } from "../homepage";
import { Accordion } from "../../ui/accordion";

export const LaLetterBuilderMyLetters: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title={li18n._(t`My letters`)} withHeading="big" className="content">
      <MyLettersContent />
    </Page>
  );
};

interface CompletedLetterCardProps {
  pdfBytes: string;
}

const CompletedLetterCard: React.FC<CompletedLetterCardProps> = (props) => {
  const { children, pdfBytes } = props;

  const downloadPdf = () => {
    const bytes = atob(pdfBytes);
    const byteChars = bytes.split("").map((el, i) => bytes.charCodeAt(i));
    const pdfBlob = new Blob([new Uint8Array(byteChars)], {
      type: "application/pdf;base64",
    });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl);
  };

  return (
    <div className="jf-la-letter-card">
      <div className="content">
        <StaticImage
          ratio="is-32x32"
          src={getLaLetterBuilderImageSrc("repair-tools")}
          alt=""
        />
        <h2>
          <Trans>Notice to repair letter</Trans>
        </h2>
        {children}
        {pdfBytes && (
          <button
            className="button is-primary is-medium jf-is-next-button"
            onClick={downloadPdf}
          >
            <Trans>Download letter</Trans>
          </button>
        )}
      </div>
      <hr />
      <Accordion question={"What's next?"} questionClassName="">
        <h2>
          <Trans>Allow 14 days for a response</Trans>
        </h2>
        <p>
          <Trans>
            If your landlord or property manager doesn’t respond, you should
            file a complaint.
          </Trans>
        </p>
        <span>
          <Trans>For LA City residents</Trans>
        </span>
        <p>
          <Trans>Call LAHD at (866) 557-7368</Trans>
        </p>

        <span>
          <Trans>For LA county residents</Trans>
        </span>
        <p>
          <Trans>Call LADBS at (213) 473-3231</Trans>
        </p>
        <h2>
          <Trans>Mark your calendar</Trans>
        </h2>
        <p>
          <Trans>
            Make sure you keep your schedule clear during the requested access
            dates:
          </Trans>
        </p>
      </Accordion>
    </div>
  );
};

const MyLettersContent: React.FC = (props) => {
  const { session } = useContext(AppContext);
  const processedLetters = session.habitabilityLetters?.filter(
    (el) => !!el.fullyProcessedAt && !el.letterSentAt
  );
  const sentLetters = session.habitabilityLetters?.filter(
    (el) => !!el.letterSentAt
  );

  return (
    <div className="jf-my-letters">
      <p className="subtitle">
        <Trans>See all your finished and unfinished letters</Trans>
      </p>
      <CreateOrContinueLetter />
      {processedLetters?.map((el, i) => (
        <CompletedLetterCard
          key={`processed-letter-${i}`}
          pdfBytes={el.pdfBase64}
        >
          <h3>
            <Trans>JustFix is preparing your letter</Trans>
          </h3>
          <p>
            <Trans>
              Your tracking number will appear here once the letter has been
              sent.
            </Trans>
          </p>
        </CompletedLetterCard>
      ))}
      {sentLetters?.map((el, i) => {
        const sentDate = new Date(el.letterSentAt!);
        const dateString = sentDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <CompletedLetterCard key={`sent-letter-${i}`} pdfBytes={el.pdfBase64}>
            <h3>{`${li18n._(
              t`JustFix sent your letter on`
            )} ${dateString} `}</h3>
            <p className="jf-laletterbuilder-letter-tracking">
              <Trans>USPS tracking number:</Trans>{" "}
              <OutboundLink
                href={`https://tools.usps.com/go/TrackConfirmAction_input?strOrigTrackNum=${el.trackingNumber}`}
                target="_blank"
              >
                {el.trackingNumber}
              </OutboundLink>
            </p>
          </CompletedLetterCard>
        );
      })}
      <h3>
        <Trans>
          Do you have another housing issue that you need to address?
        </Trans>
      </h3>
      <Link to={LaLetterBuilderRouteInfo.locale.chooseLetter}>
        <Trans>View other letters</Trans>
      </Link>
    </div>
  );
};

const CreateOrContinueLetter: React.FC = (props) => {
  const { session } = useContext(AppContext);

  return (
    <SessionUpdatingFormSubmitter
      mutation={LaLetterBuilderCreateLetterMutation}
      initialState={{}}
      onSuccessRedirect={
        LaLetterBuilderRouteInfo.locale.habitability.issues.prefix
      }
    >
      {(sessionCtx) => (
        <div className="my-letters-box">
          <StaticImage
            ratio="is-32x32"
            src={getLaLetterBuilderImageSrc("repair-tools")}
            alt=""
          />
          <h3>
            <Trans>Notice to repair letter</Trans>
          </h3>
          {session.hasHabitabilityLetterInProgress ? (
            <>
              <p>
                <Trans>In progress</Trans>
              </p>
              <p>
                <Trans>
                  Document repairs needed in your home, and send a formal
                  request to your landlord
                </Trans>
              </p>
              <div className="start-letter-button">
                <Link
                  to={
                    LaLetterBuilderRouteInfo.locale.habitability.issues.prefix
                  }
                  className="button jf-is-next-button is-primary is-medium"
                >
                  {li18n._(t`Continue letter`)}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>
                <Trans>Start your letter now</Trans>
              </p>
              <div className="start-letter-button">
                <NextButton
                  isLoading={sessionCtx.isLoading}
                  label={li18n._(t`Start letter`)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </SessionUpdatingFormSubmitter>
  );
};

export const WelcomeMyLetters: React.FC<ProgressStepProps> = (props) => {
  return (
    <WelcomePage
      {...props}
      title={li18n._(t`My letters`)}
      // We need a Welcome page for navigation back from the first flow step
      // to work, but always skip it.
      hasFlowBeenCompleted={true}
    >
      <MyLettersContent />
    </WelcomePage>
  );
};
