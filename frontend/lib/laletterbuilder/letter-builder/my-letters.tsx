import React, { useContext } from "react";
import { Link } from "react-router-dom";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { WelcomePage } from "../../common-steps/welcome";
import { AppContext } from "../../app-context";
import { OutboundLink } from "../../ui/outbound-link";
import { StaticImage } from "../../ui/static-image";
import { getLaLetterBuilderImageSrc } from "../homepage";
import { Accordion } from "../../ui/accordion";
import {
  LaLetterBuilderDownloadPdfMutation,
  LaLetterBuilderDownloadPdfMutation_output,
} from "../../queries/LaLetterBuilderDownloadPdfMutation";
import { bulmaClasses } from "../../ui/bulma";
import { TextualFormField } from "../../forms/form-fields";
import {
  HabitabilityLetterMailChoice,
  LaLetterBuilderDownloadPDFInput,
} from "../../queries/globalTypes";
import { PhoneNumber } from "../components/phone-number";
import { CreateLetterCard } from "./choose-letter";
import ResponsiveElement from "../components/responsive-element";
import { friendlyUTCDate } from "../../util/date-util";
import { logEvent } from "../../analytics/util";
import { LetterChoice } from "../../../../common-data/la-letter-builder-letter-choices";

export const LaLetterBuilderMyLetters: React.FC<ProgressStepProps> = (
  props
) => {
  return (
    <Page title={li18n._(t`My letters`)}>
      <ResponsiveElement className="mb-6" desktop="h3" touch="h1">
        <Trans>My letters</Trans>
      </ResponsiveElement>
      <MyLettersContent />
    </Page>
  );
};

function downloadLetterPdf(
  output: LaLetterBuilderDownloadPdfMutation_output,
  input: LaLetterBuilderDownloadPDFInput
): string {
  if (output.pdfBase64) {
    logEvent("latenants.letter.download", {
      letterType: "HABITABILITY" as LetterChoice,
      letterId: input.letterId,
    });
    const bytes = atob(output.pdfBase64);
    const byteChars = bytes.split("").map((el, i) => bytes.charCodeAt(i));
    const pdfBlob = new Blob([new Uint8Array(byteChars)], {
      type: "application/pdf;base64",
    });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl);
  }
  return "";
}

interface CompletedLetterCardProps {
  id: string;
  dates: string[];
  isSafeModeEnabled?: boolean;
}

const CompletedLetterCard: React.FC<CompletedLetterCardProps> = (props) => {
  const { id, dates, children, isSafeModeEnabled } = props;
  return (
    <div className="jf-la-letter-card">
      <div className="p-6">
        <StaticImage
          ratio="is-32x32"
          src={getLaLetterBuilderImageSrc("repair-tools")}
          alt=""
        />
        <h2 className="mt-5 mb-3">
          <Trans>Notice to repair letter</Trans>
        </h2>
        {children}
        {!isSafeModeEnabled && (
          <SessionUpdatingFormSubmitter
            mutation={LaLetterBuilderDownloadPdfMutation}
            initialState={(s) => ({
              letterId: id,
            })}
            onSuccessRedirect={downloadLetterPdf}
          >
            {(ctx) => (
              <button
                type="submit"
                className={`${bulmaClasses("button", "is-primary", {
                  "is-loading": ctx.isLoading,
                })} mt-7`}
              >
                <Trans>Download letter</Trans>
                <TextualFormField
                  {...ctx.fieldPropsFor("letterId")}
                  fieldProps={{ className: "is-hidden" }}
                  label="Hidden letter ID field"
                />
              </button>
            )}
          </SessionUpdatingFormSubmitter>
        )}
      </div>
      <hr />
      <Accordion
        question={li18n._(t`What's next?`)}
        questionClassName=""
        onClick={(isExpanded) =>
          logEvent("ui.accordion.click", {
            label: "after-letter-sent-info",
            isExpanded,
          })
        }
      >
        <h2>
          <Trans>Allow 14 days for a response</Trans>
        </h2>
        <p>
          <Trans>
            If your landlord or property manager doesn’t respond, you should
            file a complaint.
          </Trans>
        </p>
        <span className="is-small">
          <Trans>For LA City residents</Trans>
        </span>
        <p>
          <Trans>
            Call LAHD at <PhoneNumber number="(866) 557-7368" />
          </Trans>
        </p>
        <span className="is-small">
          <Trans>For LA county residents</Trans>
        </span>
        <p>
          <Trans>
            Call LADBS at <PhoneNumber number="(213) 473-3231" />
          </Trans>
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
        <ul>
          {dates.map((date, i) => (
            <li key={i}>{friendlyUTCDate(date)}</li>
          ))}
        </ul>
      </Accordion>
    </div>
  );
};

const MyLettersContent: React.FC = (props) => {
  const { session } = useContext(AppContext);
  const processedLetters = session.habitabilityLetters?.filter(
    (el) =>
      !!el.fullyProcessedAt &&
      !el.letterSentAt &&
      el.mailChoice == HabitabilityLetterMailChoice.WE_WILL_MAIL
  );
  const sentLetters = session.habitabilityLetters?.filter(
    (el) =>
      !!el.letterSentAt ||
      el.mailChoice == HabitabilityLetterMailChoice.USER_WILL_MAIL
  );

  return (
    <div className="jf-my-letters mb-7">
      {(!!processedLetters?.length || !!sentLetters?.length) && (
        <h2 className="mb-3">
          <Trans>Completed</Trans>
        </h2>
      )}
      {processedLetters?.map((letter) => (
        <CompletedLetterCard
          key={`processed-letter-${letter.id}`}
          id={letter.id}
          dates={session.accessDates}
          isSafeModeEnabled={session.isSafeModeEnabled}
        >
          <ResponsiveElement className="mb-3" desktop="h4" touch="h3">
            <Trans>JustFix is preparing your letter</Trans>
          </ResponsiveElement>
          <p className="is-small">
            <Trans>
              Your tracking number will appear here once the letter has been
              sent.
            </Trans>
          </p>
        </CompletedLetterCard>
      ))}
      {sentLetters?.map((letter) => {
        const sentDate =
          letter.mailChoice == "USER_WILL_MAIL"
            ? new Date(letter.fullyProcessedAt!)
            : new Date(letter.letterSentAt!);
        const dateString = sentDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <CompletedLetterCard
            key={`sent-letter-${letter.id}`}
            id={letter.id}
            dates={session.accessDates}
            isSafeModeEnabled={session.isSafeModeEnabled}
          >
            {letter.mailChoice ==
            HabitabilityLetterMailChoice.USER_WILL_MAIL ? (
              <ResponsiveElement
                className="mb-3"
                desktop="h4"
                touch="h3"
              >{`${li18n._(
                t`You downloaded this letter on ${dateString} to print and send yourself.`
              )}`}</ResponsiveElement>
            ) : (
              <>
                <ResponsiveElement
                  className="mb-3"
                  desktop="h4"
                  touch="h3"
                >{`${li18n._(
                  t`JustFix sent your letter on`
                )} ${dateString} `}</ResponsiveElement>
                <p className="jf-laletterbuilder-letter-tracking is-small">
                  <Trans>USPS tracking number:</Trans>{" "}
                  <OutboundLink
                    href={`https://tools.usps.com/go/TrackConfirmAction_input?strOrigTrackNum=${letter.trackingNumber}`}
                    target="_blank"
                  >
                    {letter.trackingNumber}
                  </OutboundLink>
                </p>
              </>
            )}
          </CompletedLetterCard>
        );
      })}

      {session.hasHabitabilityLetterInProgress && (
        <>
          <h2 className="mt-9">
            <Trans>In progress</Trans>
          </h2>
          <div className="my-letters-box mb-9">
            <StaticImage
              ratio="is-32x32"
              src={getLaLetterBuilderImageSrc("repair-tools")}
              alt=""
            />
            <h2 className="mt-5 mb-3">
              <Trans>Notice to repair letter</Trans>
            </h2>
            <ResponsiveElement desktop="h4" touch="h3">
              <Trans>In progress</Trans>
            </ResponsiveElement>
            <div className="start-letter-button">
              <Link
                to={LaLetterBuilderRouteInfo.locale.habitability.issues.prefix}
                className="button jf-is-next-button is-primary is-medium"
              >
                {li18n._(t`View letter`)}
              </Link>
            </div>
          </div>
        </>
      )}
      <h2 className="mb-3 mt-9">
        <Trans>Start a new letter</Trans>
      </h2>
      {!session.habitabilityLetters?.length && <CreateLetterCard />}
      <p className="mb-5">
        <Trans>
          Do you have another housing issue that you need to address?
        </Trans>
      </p>
      <Link to={LaLetterBuilderRouteInfo.locale.chooseLetter}>
        <Trans>View other letters</Trans>
      </Link>
    </div>
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
