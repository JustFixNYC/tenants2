import React, { useState } from "react";
import { RouteComponentProps } from "react-router";
import { formatPhoneNumber } from "../forms/phone-number-form-field";
import {
  SearchAutocomplete,
  SearchAutocompleteHelpers,
} from "../forms/search-autocomplete";
import { GraphQLSearchRequester } from "../networking/graphql-search-requester";
import {
  AdminUserSearch,
  AdminUserSearch_output,
} from "../queries/AdminUserSearch";
import Page from "../ui/page";
import { SimpleProgressiveEnhancement } from "../ui/progressive-enhancement";
import { assertNotUndefined } from "../util/util";
import { adminGetUserFullName, AdminUserInfo } from "./admin-user-info";
import { staffOnlyView } from "./staff-only-view";

type UserDetails = AdminUserSearch_output;

type UserSearchResult = {
  text: string | null;
  fullDetails?: UserDetails;
};

const UserSearchHelpers: SearchAutocompleteHelpers<
  UserSearchResult,
  UserDetails[]
> = {
  createSearchRequester: (options) =>
    new GraphQLSearchRequester({ ...options, queryInfo: AdminUserSearch }),
  itemToKey: (item) => item.fullDetails?.id,
  itemToString: (item) => item?.text ?? "",
  getIncompleteItem: (text) => ({ text }),
  searchResultsToItems: (results) => {
    return results.map((user) => ({
      text: `${adminGetUserFullName(user)} ${user.phoneNumber}`,
      fullDetails: user,
    }));
  },
};

const AutocompleteListItem: React.FC<UserSearchResult> = (props) => {
  const fd = assertNotUndefined(props.fullDetails);

  return (
    <div>
      {fd.firstName} {fd.lastName}{" "}
      <span className="is-size-7"> {formatPhoneNumber(fd.phoneNumber)}</span>
      <div className="is-size-7">{fd.email}</div>
    </div>
  );
};

export const AdminDirectoryWidget: React.FC<{}> = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [networkError, setNetworkError] = useState(false);

  return (
    <>
      {networkError && (
        <div className="notification is-danger">
          Oops, a network error occurred. Try reloading the page?
        </div>
      )}
      <SimpleProgressiveEnhancement>
        <SearchAutocomplete
          helpers={UserSearchHelpers}
          label="Search for a user"
          placeholder="name, phone number, or email"
          renderListItem={(item) => <AutocompleteListItem {...item} />}
          onChange={(item) => {
            setNetworkError(false);
            setUserDetails(item.fullDetails ?? null);
          }}
          onNetworkError={(e) => {
            console.log(e);
            setNetworkError(true);
          }}
        />
      </SimpleProgressiveEnhancement>
      {userDetails && (
        <div className="content">
          <AdminUserInfo user={userDetails} showPhoneNumber showName />
        </div>
      )}
    </>
  );
};

export const AdminDirectory: React.FC<RouteComponentProps<any>> = staffOnlyView(
  () => (
    <Page title="Admin user directory" withHeading>
      <AdminDirectoryWidget />
    </Page>
  )
);
