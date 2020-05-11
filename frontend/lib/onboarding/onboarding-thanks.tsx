import React from "react";
import Page from "../ui/page";
import { Link } from "react-router-dom";

export const OnboardingThanks: React.FC<{ next: string }> = ({ next }) => {
  return (
    <Page title="Thanks for signing up!" className="content has-text-centered">
      <h1>Thanks for signing up!</h1>
      <p className="subtitle is-4 is-marginless">
        An email to verify your account is on its way, from{" "}
        <strong>no-reply@justfix.nyc</strong>.
      </p>
      <p>Don't see one? Check your spam folder.</p>
      <br />
      <p>
        <Link to={next} className="button is-primary is-medium">
          Continue
        </Link>
      </p>
    </Page>
  );
};
