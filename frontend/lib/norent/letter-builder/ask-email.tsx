import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { useIsOnboardingUserInStateWithProtections } from "./national-metadata";
import { Trans } from "@lingui/macro";
import { AskEmail } from "../../common-steps/ask-email";

export const NorentLbAskEmail = MiddleProgressStep((props) => {
  const isWritingLetter = useIsOnboardingUserInStateWithProtections();

  return (
    <AskEmail {...props}>
      {isWritingLetter ? (
        <p>
          <Trans>
            We'll use this information to email you a copy of your letter.
          </Trans>
        </p>
      ) : (
        <p>
          <Trans>We'll use this information to send you updates.</Trans>
        </p>
      )}
    </AskEmail>
  );
});
