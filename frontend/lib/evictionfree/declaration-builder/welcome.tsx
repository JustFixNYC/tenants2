import { Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { SimpleClearSessionButton } from "../../forms/clear-session-button";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { assertNotNull } from "../../util/util";
import { EvictionFreeRoutes } from "../route-info";

export const EvictionFreeDbWelcome: React.FC<ProgressStepProps> = (props) => {
  const { session } = useContext(AppContext);

  return (
    <Page title="Build your declaration" className="content" withHeading="big">
      {session.phoneNumber ? (
        <p>
          <Trans>
            Looks like you've been here before. Click "Next" to be taken to
            where you left off.
          </Trans>
        </p>
      ) : (
        <>
          <p>
            In order to benefit from the eviction protections that local elected
            officials have put in place, you should notify your landlord by
            filling out a hardship declaration form.{" "}
            <span className="has-text-weight-semibold">
              In the event that your landlord tries to evict you, the courts
              will see this as a proactive step that helps establish your
              defense.
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
                your landlord or management company’s mailing and/or email
                address
              </p>
            </li>
          </ul>
        </>
      )}
      <div className="buttons jf-two-buttons">
        <SimpleClearSessionButton to={EvictionFreeRoutes.locale.home} />
        <Link
          to={assertNotNull(props.nextStep)}
          className="button jf-is-next-button is-primary is-medium"
        >
          <Trans>Next</Trans>
        </Link>
      </div>
    </Page>
  );
};
