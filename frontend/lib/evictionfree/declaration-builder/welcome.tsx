import { t } from "@lingui/macro";
import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { WelcomePage } from "../../common-steps/welcome";
import { li18n } from "../../i18n-lingui";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { EvictionFreeRedirectToHomepageWithMessage } from "./redirect-to-homepage-with-message";
import { hasEvictionFreeDeclarationBeenSent } from "./step-decorators";

export const EvictionFreeDbWelcome: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);

  return (
    <WelcomePage
      {...props}
      title={li18n._(t`Protect yourself from eviction`)}
      hasFlowBeenCompleted={hasEvictionFreeDeclarationBeenSent(session)}
    >
      <EvictionFreeRedirectToHomepageWithMessage />
      {/*
      <>
        <p>
          <Trans id="evictionfree.introductionToDeclarationFormSteps">
            In order to benefit from the eviction protections that local
            government representatives have put in place, you can notify your
            landlord by filling out a hardship declaration form.{" "}
            <span className="has-text-weight-semibold">
              In the event that your landlord tries to evict you, the courts
              will see this as a proactive step that helps establish your
              defense.
            </span>
          </Trans>
        </p>
        <Trans id="evictionfree.outlineOfDeclarationFormSteps">
          <p>
            In the next few steps, we’ll help you fill out your hardship
            declaration form. Have this information on hand if possible:
          </p>
          <ul>
            <li>
              <p>your phone number and residence</p>
            </li>
            <li>
              <p>
                your landlord or management company’s mailing and/or email
                address
              </p>
            </li>
          </ul>
        </Trans>
    </> */}
    </WelcomePage>
  );
};
