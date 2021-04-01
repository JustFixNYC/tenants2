import React from "react";
import { niceAdminTimestamp } from "./admin-util";
import { friendlyPhoneNumber } from "../util/util";
import { JustfixUserType } from "../queries/JustfixUserType";
import { whoOwnsWhatURL } from "../ui/wow-link";

/**
 * RapidPro group a user is added to if they say they have been
 * assigned an attorney.
 */
const EHPA_ATTORNEY_ASSIGNED_GROUP = "EHPA Attorney Assignment Successful";

/**
 * RapidPro group a user is added to if they say they have not yet been
 * assigned an attorney.
 */
const EHPA_ATTORNEY_NOT_ASSIGNED_GROUP = "EHPA Attorney Assignment Pending";

const EhpaAttorneyAssigned: React.FC<{ rapidproGroups: string[] }> = (
  props
) => {
  const g = props.rapidproGroups;
  const title = "EHPA attorney assigned";
  const wasAssigned = g.includes(EHPA_ATTORNEY_ASSIGNED_GROUP)
    ? true
    : g.includes(EHPA_ATTORNEY_NOT_ASSIGNED_GROUP)
    ? false
    : null;

  switch (wasAssigned) {
    case true:
      return <p>{title}: Yes</p>;
    case false:
      return <p>{title}: No</p>;
    case null:
      return null;
  }
};

export function adminGetUserFullName(user: {
  firstName: string;
  lastName: string;
}): string {
  return [user.firstName, user.lastName].join(" ").trim();
}

export const AdminUserInfo: React.FC<{
  user: JustfixUserType;
  showPhoneNumber: boolean;
  showName?: boolean;
}> = ({ user, showPhoneNumber, showName }) => {
  const name = adminGetUserFullName(user);
  return (
    <>
      {showName && name && <p>This user's name is {name}.</p>}
      {showPhoneNumber && (
        <p>
          This user's phone number is {friendlyPhoneNumber(user.phoneNumber)}.
        </p>
      )}
      {user.email && <p>Their email is {user.email}.</p>}
      <EhpaAttorneyAssigned rapidproGroups={user.rapidproGroups} />
      {user.onboardingInfo && (
        <p>Their signup intent is {user.onboardingInfo.signupIntent}.</p>
      )}
      {user.letterRequest && (
        <p>
          The user completed a letter of complaint on{" "}
          {niceAdminTimestamp(user.letterRequest.updatedAt)}.
        </p>
      )}
      <a href={user.adminUrl} className="button is-small" target="_blank">
        Edit user
      </a>
      {user.onboardingInfo?.padBbl && (
        <a
          href={whoOwnsWhatURL(user.onboardingInfo.padBbl)}
          className="button is-small"
          target="_blank"
          rel="noopener noreferrer"
        >
          View user's building in WoW
        </a>
      )}
    </>
  );
};
