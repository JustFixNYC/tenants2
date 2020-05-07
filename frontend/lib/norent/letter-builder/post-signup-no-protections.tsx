import React from "react";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { getStatesWithLimitedProtectionsFAQSectionURL } from "../faqs";
import { CenteredPrimaryButtonLink } from "../../ui/buttons";
import { Trans } from "@lingui/macro";

export const PostSignupNoProtections: React.FC<ProgressStepProps> = (props) => {
  return (
    <Page title="Your account is set up" withHeading="big">
      <Trans>
        <p>
          Now that you have an account with us, we can let you know when any
          important changes take place in your state.
        </p>
        <p>
          In the meantime, you can read about what you can do next, from
          documenting your situation to connecting with others.
        </p>
      </Trans>
      <br />
      <CenteredPrimaryButtonLink
        to={getStatesWithLimitedProtectionsFAQSectionURL()}
      >
        <Trans>Learn more</Trans>
      </CenteredPrimaryButtonLink>
    </Page>
  );
};
