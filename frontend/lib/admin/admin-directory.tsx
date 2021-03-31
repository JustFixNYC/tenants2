import React, { useState } from "react";
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
import { AdminUserInfo } from "./admin-user-info";

type UserDetails = AdminUserSearch_output;

type UserSearchResult = {
  text: string | null;
  fullDetails?: UserDetails;
};

function userDetailsToSearchResult(d: UserDetails): UserSearchResult {
  const phone = formatPhoneNumber(d.phoneNumber);
  return {
    text: `${d.firstName} ${d.lastName} / ${phone}`,
    fullDetails: d,
  };
}

const UserSearchHelpers: SearchAutocompleteHelpers<
  UserSearchResult,
  UserDetails[]
> = {
  createSearchRequester: (options) =>
    new GraphQLSearchRequester({ ...options, queryInfo: AdminUserSearch }),
  itemToKey: (item) => item.text,
  itemToString: (item) => item?.text ?? "",
  getIncompleteItem: (text) => ({ text }),
  searchResultsToItems: (results) => {
    return results.map(userDetailsToSearchResult);
  },
};

export const AdminDirectory: React.FC<{}> = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [networkError, setNetworkError] = useState(false);

  return (
    <Page title="Admin user directory" withHeading>
      {networkError && (
        <div className="notification is-danger">
          Oops, a network error occurred. Try reloading the page?
        </div>
      )}
      <SimpleProgressiveEnhancement>
        <SearchAutocomplete
          helpers={UserSearchHelpers}
          label="Search for users"
          onChange={(item) => {
            setNetworkError(false);
            if (item.fullDetails) {
              setUserDetails(item.fullDetails);
            } else {
              setUserDetails(null);
            }
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
    </Page>
  );
};
