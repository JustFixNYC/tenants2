import React, { useContext } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { EmailCta, HtmlEmail } from "../static-page/html-email";
import { AppContext } from "../app-context";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import i18n, { SupportedLocaleMap } from "../i18n";
import { NorentRoutes } from "./routes";

function getUserFullName(session: AllSessionInfo): string {
  return [session.firstName, session.lastName].join(" ").trim();
}

/**
 * Placeholder for text that still needs to be translated to
 * Spanish.
 *
 * TODO: Before sending, we should remove this!
 */
const TODO_TRANSLATE_TO_SPANISH = "TODO: TRANSLATE TO SPANISH";

type ContentProps = {
  fullName: string;
  ctaURL: string;
};

const EnglishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Dear {props.fullName},</p>
    <EmailCta href={props.ctaURL}>
      Send a declaration letter to your landlord now
    </EmailCta>
  </>
);

const SpanishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Estimad@ {props.fullName},</p>
    <EmailCta href={props.ctaURL}>{TODO_TRANSLATE_TO_SPANISH}</EmailCta>
  </>
);

const CONTENT: SupportedLocaleMap<React.FC<ContentProps>> = {
  en: EnglishContent,
  es: SpanishContent,
};

const SUBJECT: SupportedLocaleMap<string> = {
  en: "Important Updates to NoRent.org and California Eviction Protections",
  es: TODO_TRANSLATE_TO_SPANISH,
};

const Content: React.FC<{}> = () => {
  const { session, server } = useContext(AppContext);
  const Content = CONTENT[i18n.locale];

  return (
    <Content
      fullName={getUserFullName(session)}
      ctaURL={`${server.originURL}${NorentRoutes.locale.letter.latestStep}`}
    />
  );
};

export const OneOffEmail = asEmailStaticPage(() => (
  <HtmlEmail subject={SUBJECT[i18n.locale]}>
    <Content />
  </HtmlEmail>
));