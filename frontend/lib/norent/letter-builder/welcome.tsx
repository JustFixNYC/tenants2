import React, { useContext } from "react";
import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link, Route } from "react-router-dom";
import { assertNotNull } from "../../util/util";
import { AppContext } from "../../app-context";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { LogoutMutation } from "../../queries/LogoutMutation";

export const NorentLbWelcome: React.FC<ProgressStepProps> = (props) => (
  <Page title="Build your letter" withHeading="big" className="content">
    <p>This is gonna be awesome!</p>
    <Link to={assertNotNull(props.nextStep)} className="button is-primary">
      Next
    </Link>
    <DebugArea />
  </Page>
);

const DebugArea = () => {
  const session = useContext(AppContext).session;

  return (
    <Route
      render={(props) => (
        <SessionUpdatingFormSubmitter
          mutation={LogoutMutation}
          initialState={{}}
          onSuccessRedirect={props.location.pathname}
        >
          {(ctx) => (
            <div className="content">
              <hr />
              <p>
                <code>DEBUG INFO</code>
              </p>
              {session.phoneNumber ? (
                <p>
                  Currently logged in with phone number: {session.phoneNumber}
                </p>
              ) : (
                <p>Not logged in.</p>
              )}
              <p>
                Last queried phone number:{" "}
                {session.lastQueriedPhoneNumber || "none"}
              </p>
              <button type="submit" className="button is-light">
                Clear session/logout
              </button>
            </div>
          )}
        </SessionUpdatingFormSubmitter>
      )}
    />
  );
};
