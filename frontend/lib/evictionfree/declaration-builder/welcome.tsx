import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { WelcomePage } from "../../common-steps/welcome";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { hasEvictionFreeDeclarationBeenSent } from "./step-decorators";

export const EvictionFreeDbWelcome: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);

  return (
    <WelcomePage
      {...props}
      title="Build your declaration"
      hasFlowBeenCompleted={hasEvictionFreeDeclarationBeenSent(session)}
    >
      <>
        <p>
          In order to benefit from the eviction protections that local elected
          officials have put in place, you should notify your landlord by
          filling out a hardship declaration form.{" "}
          <span className="has-text-weight-semibold">
            In the event that your landlord tries to evict you, the courts will
            see this as a proactive step that helps establish your defense.
          </span>
        </p>
        <p>
          In the next few steps, we’ll help you build your declaration. Have
          this information on hand if possible:
        </p>
        <ul>
          <li>
            <p>your phone number, email address, and residence</p>
          </li>
          <li>
            <p>
              your landlord or management company’s mailing and/or email address
            </p>
          </li>
        </ul>
      </>
    </WelcomePage>
  );
};
