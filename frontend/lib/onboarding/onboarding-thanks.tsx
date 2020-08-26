import React from "react";
import Page from "../ui/page";
import { Link } from "react-router-dom";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

export const OnboardingThanks: React.FC<{ next: string }> = ({ next }) => {
  return (
    <Page
      title={li18n._(t`Thanks for signing up!`)}
      withHeading="big"
      className="content has-text-centered"
    >
      <Trans>
        <p className="subtitle is-4 is-marginless">
          An email to verify your account is on its way, from{" "}
          <strong>no-reply@justfix.nyc</strong>.
        </p>
        <p>Don't see one? Check your spam folder.</p>
      </Trans>
      <br />
      <p>
        <Link to={next} className="button is-primary is-medium">
          <Trans>Continue</Trans>
        </Link>
      </p>
    </Page>
  );
};
