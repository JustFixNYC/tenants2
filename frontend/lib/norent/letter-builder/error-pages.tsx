import React from "react";
import Page from "../../ui/page";
import { NorentRoutes } from "../route-info";
import { CustomerSupportLink } from "../../ui/customer-support-link";
import { CenteredPrimaryButtonLink } from "../../ui/buttons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { NorentCannotSendMoreLettersText } from "./more-letters";

type ErrorPageProps = {
  title: string;
  children: React.ReactNode;
};

const getLbRoutes = () => NorentRoutes.locale.letter;

const ErrorPage: React.FC<ErrorPageProps> = (props) => (
  <Page title={props.title} withHeading="big" className="content">
    {props.children}
  </Page>
);

export const NorentNotLoggedInErrorPage: React.FC<{}> = () => (
  <ErrorPage title={li18n._(t`Looks like you're not logged in`)}>
    <p>
      <Trans>Sign up or log in to your account to access our tool.</Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().phoneNumber}>
      <Trans>Log in</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);

export const NorentAlreadySentLetterErrorPage: React.FC<{}> = () => (
  <ErrorPage title={li18n._(t`You can't send any more letters`)}>
    <NorentCannotSendMoreLettersText />
    <p>
      <Trans>
        Continue to the confirmation page for information about the last letter
        you sent and next steps you can take.
      </Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().confirmation}>
      <Trans>Continue</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);

export const NorentAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <ErrorPage title={li18n._(t`Looks like you're already logged in`)}>
    <p>
      <Trans>
        If you need to make changes to your name or contact information, please
        contact <CustomerSupportLink />.
      </Trans>
    </p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().latestStep}>
      <Trans>Continue</Trans>
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);
