import React, { useContext } from "react";
import { StaticPage } from "./static-page";
import { getAppStaticContext } from "../app-static-context";
import { withRouter, RouteComponentProps } from "react-router-dom";

export const EmailStaticPage: React.FC<{ children: JSX.Element }> = (props) => (
  <StaticPage httpHeaders={{ "Content-Type": "text/plain; charset=utf-8" }}>
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

    return <p className="jf-email-subject">Subject: {props.value}</p>;
  }
);

export function asEmailStaticPage(
  Component: React.ComponentType<{}>
): React.FC<{}> {
  return () => (
    <EmailStaticPage>
      <Component />
    </EmailStaticPage>
  );
}
