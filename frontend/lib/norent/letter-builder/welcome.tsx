import React, { useContext } from "react";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { AppContext } from "../../app-context";
import { hasNorentLetterBeenSent } from "./step-decorators";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { WelcomePage } from "../../common-steps/welcome";
import { OutboundLink } from "../../ui/outbound-link";

export const NorentDeprecationWarning = () => {
  return (
    <p className="jf-norent-warning has-background-white-ter">
      <Trans id="norent.deprecation">
        As of <strong>December 1st, 2022</strong>, NoRent.org will longer send
        letters. Please visit{" "}
        <OutboundLink href="https://www.stayhousedla.org/">
          Stay Housed L.A.
        </OutboundLink>{" "}
        for updates on eviction protections in Los Angeles.
      </Trans>
    </p>
  );
};

export const NorentLbWelcome: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);

  return (
    <WelcomePage
      {...props}
      title={li18n._(t`Build your letter`)}
      hasFlowBeenCompleted={hasNorentLetterBeenSent(session)}
    >
      <>
        <p>
          <Trans id="norent.introductionToLetterBuilderSteps">
            In order to benefit from the eviction protections that local elected
            officials have put in place, you should notify your landlord of your
            non-payment for reasons related to COVID-19.{" "}
            <span className="has-text-weight-semibold">
              In the event that your landlord tries to evict you, the courts
              will see this as a proactive step that helps establish your
              defense.
            </span>
          </Trans>
        </p>
        <Trans id="norent.outlineOfLetterBuilderSteps">
          <p>
            In the next few steps, we’ll build your letter using the following
            information. Have this information on hand if possible:
          </p>
          <ul>
            <li>
              <p>your phone number, email address, and residence</p>
            </li>
            <li>
              <p>
                your landlord or management company’s mailing and/or email
                address
              </p>
            </li>
          </ul>
        </Trans>
        <NorentDeprecationWarning />
      </>
    </WelcomePage>
  );
};
