import React, { useContext } from "react";
import { AppContext } from "../app-context";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { UnimpersonateMutation } from "../queries/UnimpersonateMutation";

export const UnimpersonateWidget: React.FC<{}> = () => {
  const { session, server } = useContext(AppContext);
  const { isStaff, impersonatedBy, firstName, lastName } = session;
  const nextURL = server.adminIndexURL;

  // We still need to render the form if the user is staff, because
  // this might be the instant just after the form was successfully
  // submitted, when the user is the staff member who was just
  // impersonating another user. If we don't render the form, then
  // the form's redirect logic won't kick in!
  if (!(isStaff || impersonatedBy)) {
    return null;
  }

  return (
    <SessionUpdatingFormSubmitter
      mutation={UnimpersonateMutation}
      initialState={{}}
      onSuccessRedirect={nextURL}
    >
      {(ctx) =>
        impersonatedBy ? (
          <div className="content" style={{ marginTop: "2rem" }}>
            <h2>Switch back to {impersonatedBy}?</h2>
            <p>
              You are currently impersonating {firstName} {lastName}, and can
              switch back to being logged in as {impersonatedBy} using the
              button below. If you do this, you will be taken to the
              administrative area of the site.
            </p>
            <button type="submit" className="button is-light is-medium">
              Switch back to {impersonatedBy}
            </button>
          </div>
        ) : (
          <></>
        )
      }
    </SessionUpdatingFormSubmitter>
  );
};
