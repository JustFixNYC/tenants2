import React from "react";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { getStatesWithLimitedProtectionsFAQSectionURL } from "../faqs";

export const PostSignupNoProtections: React.FC<ProgressStepProps> = (props) => {
  return (
    <Page title="Your account is set up" withHeading="big">
      <p>
        Now that you have an account with us, we can let you know when any
        important changes take place in your state.
      </p>
      <p>
        In the meantime, you can read about what you can do next, from
        documenting your situation to connecting with others.
      </p>
      <p className="has-text-centered">
        <Link
          className="button is-primary is-large jf-is-extra-wide"
          to={getStatesWithLimitedProtectionsFAQSectionURL()}
        >
          Learn more
        </Link>
      </p>
    </Page>
  );
};
