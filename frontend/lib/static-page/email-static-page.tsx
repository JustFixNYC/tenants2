import React, { useContext } from "react";
import { StaticPage } from "./static-page";
import { getAppStaticContext } from "../app-static-context";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { Trans } from "@lingui/macro";

export type EmailStaticPageOptions = {
  isHtmlEmail?: boolean;
};

export const EmailStaticPage: React.FC<
  { children: JSX.Element } & EmailStaticPageOptions
> = (props) => (
  <StaticPage
    httpHeaders={
      props.isHtmlEmail
        ? undefined
        : { "Content-Type": "text/plain; charset=utf-8" }
    }
    shouldInlineCss={props.isHtmlEmail}
  >
    <EmailContext.Provider value={true}>{props.children}</EmailContext.Provider>
  </StaticPage>
);

const EmailContext = React.createContext<boolean>(false);

export const EmailSubject = withRouter(
  (props: RouteComponentProps & { value: string }) => {
    const staticCtx = getAppStaticContext(props);
    const isRenderingEmail = useContext(EmailContext);

    if (staticCtx && isRenderingEmail) {
      staticCtx.httpHeaders["X-JustFix-Email-Subject"] = props.value;
      return null;
    }

    return (
      <p className="jf-email-subject">
        <Trans>Subject: {props.value}</Trans>
      </p>
    );
  }
);

export function asEmailStaticPage(
  Component: React.ComponentType<{}>
): React.FC<EmailStaticPageOptions> {
  return ({ isHtmlEmail }) => (
    <EmailStaticPage isHtmlEmail={isHtmlEmail}>
      <Component />
    </EmailStaticPage>
  );
}
