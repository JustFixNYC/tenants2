import React from "react";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { NorentRoutes } from "../routes";
import { CustomerSupportLink } from "../../ui/customer-support-link";

type ErrorPageProps = {
  title: string;
  children: React.ReactNode;
};

type CtaLinkProps = {
  to: string;
  children: React.ReactNode;
};

const CtaLink: React.FC<CtaLinkProps> = (props) => (
  <p className="has-text-centered">
    <Link className="button is-primary is-large jf-is-extra-wide" to={props.to}>
      {props.children}
    </Link>
  </p>
);

const getLbRoutes = () => NorentRoutes.locale.letter;

const ErrorPage: React.FC<ErrorPageProps> = (props) => (
  <Page title={props.title} withHeading="big" className="content">
    {props.children}
  </Page>
);

export const NorentNotLoggedInErrorPage: React.FC<{}> = () => (
  <ErrorPage title="Looks like you're not logged in">
    <p>Sign up or log in to your account to access our tool.</p>
    <CtaLink to={getLbRoutes().phoneNumber}>Log in</CtaLink>
  </ErrorPage>
);

export const NorentAlreadySentLetterErrorPage: React.FC<{}> = () => (
  <ErrorPage title="Looks like you've already sent a letter">
    <p>Our tool only allows you to send one letter at a time.</p>
    <p>Continue to the confirmation page for what to do next.</p>
    <CtaLink to={getLbRoutes().confirmation}>Continue</CtaLink>
  </ErrorPage>
);

export const NorentAlreadyLoggedInErrorPage: React.FC<{}> = () => (
  <ErrorPage title="Looks like you're already logged in">
    <p>
      If you need to make changes to your name or contact information, please
      contact <CustomerSupportLink />.
    </p>
    <CtaLink to={getLbRoutes().latestStep}>Continue</CtaLink>
  </ErrorPage>
);
