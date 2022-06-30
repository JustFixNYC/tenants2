import { t, Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { li18n } from "../../i18n-lingui";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { LetterPreview } from "../../static-page/letter-preview";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import {
  ForeignLanguageOnly,
  InYourLanguageTranslation,
} from "../../ui/cross-language";
import { OutboundLink } from "../../ui/outbound-link";
import Page from "../../ui/page";

const Microcopy: React.FC<{ children: React.ReactNode }> = (props) => (
  <p className="is-uppercase is-size-7">{props.children}</p>
);

export const InYourLanguageMicrocopy: React.FC<{
  additionalContent?: JSX.Element;
}> = (props) => (
  <Microcopy>
    <InYourLanguageTranslation />
    {props.additionalContent && <> {props.additionalContent}</>}
  </Microcopy>
);

type LetterContent = {
  html: string;
  pdf: string;
};

type LetterPreviewProps = {
  title: string;
  letterContent: LetterContent;
  emailContent: React.FC;
  letterTranslation: React.FC;
  session: AllSessionInfo;
  prevStep: string;
  nextStep: string;
};

const LetterPreviewPage: React.FC<LetterPreviewProps> = (props) => {
  const LetterTranslation = props.letterTranslation;
  return (
    <Page
      title={li18n._(t`Review your letter`)}
      withHeading="big"
      className="content"
    >
      <p>
        <Trans>Make sure all the information is correct.</Trans>
      </p>
      <p>
        <OutboundLink href={props.letterContent.pdf} target="_blank">
          <Trans>View as PDF (recommended)</Trans>
        </OutboundLink>
      </p>
      <ForeignLanguageOnly>
        <InYourLanguageMicrocopy />
        <LetterTranslation />
        <Microcopy>
          <Trans>English version</Trans>
        </Microcopy>
      </ForeignLanguageOnly>
      <LetterPreview
        title={li18n._(t`Preview of your letter`)}
        src={props.letterContent.html}
      />
      <br />
      <p>
        <Trans>
          If the information above is not correct, go back to make changes.
        </Trans>
      </p>
      <ProgressButtonsAsLinks back={props.prevStep} next={props.nextStep} />
    </Page>
  );
};

type EmailPreviewProps = {
  emailContent: React.FC;
  landlordName?: string;
  landlordEmail?: string;
};

export const EmailPreview: React.FC<EmailPreviewProps> = (props) => {
  const { emailContent: EmailContent, landlordName, landlordEmail } = props;
  return (
    <>
      <ForeignLanguageOnly>
        <InYourLanguageMicrocopy
          additionalContent={
            <Trans>(Note: the email will be sent in English)</Trans>
          }
        />
      </ForeignLanguageOnly>
      <article className="message">
        <div className="message-header has-text-weight-normal">
          <Trans>To:</Trans> {landlordName}{" "}
          {landlordEmail && `<${landlordEmail}>`}
        </div>
        <div className="message-body has-text-left">
          <EmailContent />
        </div>
      </article>
    </>
  );
};

export function createLaLetterBuilderPreviewPage(
  englishVersionOfLetterContent: LetterContent,
  emailContent: React.FC<{}>,
  letterTranslation: React.FC<{}>
) {
  return MiddleProgressStep((props) => {
    const { session } = useContext(AppContext);

    return (
      <LetterPreviewPage
        title="LA Letter builder title"
        letterContent={englishVersionOfLetterContent}
        emailContent={emailContent}
        letterTranslation={letterTranslation}
        session={session}
        prevStep={props.prevStep}
        nextStep={props.nextStep}
      />
    );
  });
}
