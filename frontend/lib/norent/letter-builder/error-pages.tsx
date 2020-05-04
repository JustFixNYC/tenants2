import React from "react";
import Page from "../../ui/page";
import { NorentRoutes } from "../routes";
import { CustomerSupportLink } from "../../ui/customer-support-link";
import { CenteredPrimaryButtonLink } from "../../ui/buttons";

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
  <ErrorPage title="Looks like you're not logged in">
    <p>Sign up or log in to your account to access our tool.</p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().phoneNumber}>
      Log in
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);

export const NorentAlreadySentLetterErrorPage: React.FC<{}> = () => (
  <ErrorPage title="Looks like you've already sent a letter">
    <p>Our tool only allows you to send one letter at a time.</p>
    <p>Continue to the confirmation page for what to do next.</p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().confirmation}>
      Continue
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);

export const NorentAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <ErrorPage title="Looks like you're already logged in">
    <p>
      If you need to make changes to your name or contact information, please
      contact <CustomerSupportLink />.
    </p>
    <br />
    <CenteredPrimaryButtonLink to={getLbRoutes().latestStep}>
      Continue
    </CenteredPrimaryButtonLink>
  </ErrorPage>
);
