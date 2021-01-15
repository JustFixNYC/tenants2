import React from "react";
import Page from "../ui/page";
import { CustomerSupportLink } from "../ui/customer-support-link";
import { CenteredPrimaryButtonLink } from "../ui/buttons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

type ErrorPageProps = {
  title: string;
  children: React.ReactNode;
};

export const ErrorPage: React.FC<ErrorPageProps> = (props) => (
  <Page title={props.title} withHeading="big" className="content">
    {props.children}
  </Page>
);

export const AlreadyLoggedInErrorPage: React.FC<{ continueUrl: string }> = (
  props
) => (
  <ErrorPage title={li18n._(t`Looks like you're already logged in`)}>
    <p>
      <Trans>
        If you need to make changes to your name or contact information, please
        contact <CustomerSupportLink />.
      </Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink to={props.continueUrl}>
      <Trans>Continue</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);

export const NotLoggedInErrorPage: React.FC<{ loginUrl: string }> = (props) => (
  <ErrorPage title={li18n._(t`Looks like you're not logged in`)}>
    <p>
      <Trans>Sign up or log in to your account to access our tool.</Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink to={props.loginUrl}>
      <Trans>Log in</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);
