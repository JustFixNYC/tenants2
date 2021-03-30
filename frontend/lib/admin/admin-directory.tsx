import { SearchRequester } from "@justfixnyc/geosearch-requester";
import React, { useState } from "react";
import { getGlobalAppServerInfo } from "../app-context";
import { formatPhoneNumber } from "../forms/phone-number-form-field";
import {
  SearchAutocomplete,
  SearchAutocompleteHelpers,
} from "../forms/search-autocomplete";
import {
  AdminUserSearch,
  AdminUserSearchVariables,
  AdminUserSearch_userSearch,
} from "../queries/AdminUserSearch";
import Page from "../ui/page";
import { SimpleProgressiveEnhancement } from "../ui/progressive-enhancement";
import { AdminUserInfo } from "./admin-user-info";

type UserDetails = AdminUserSearch_userSearch;

type RawAdminUserSearch = { data?: AdminUserSearch };

class UserSearchRequester extends SearchRequester<RawAdminUserSearch> {
  searchQueryToURL(query: string) {
    const baseURL = getGlobalAppServerInfo().nonbatchGraphQLURL;
    const graphQL = AdminUserSearch.graphQL;
    const vars: AdminUserSearchVariables = {
      query,
    };

    return `${baseURL}?query=${encodeURIComponent(
      graphQL
    )}&variables=${encodeURIComponent(JSON.stringify(vars))}`;
  }
}

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
  RawAdminUserSearch
> = {
  createSearchRequester: (options) => new UserSearchRequester(options),
  itemToKey: (item) => item.text,
  itemToString: (item) => item?.text ?? "",
  getIncompleteItem: (text) => ({ text }),
  searchResultsToItems: (results) => {
    if (!results.data?.userSearch) {
      // TODO: Why would this ever happen?  Might want to just assert it's not nullish, or
      // raise an exception, instead of silently failing like this.
      return [];
    }
    return results.data?.userSearch.map(userDetailsToSearchResult);
  },
};

export const AdminDirectory: React.FC<{}> = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  return (
    <Page title="Admin user directory" withHeading>
      <SimpleProgressiveEnhancement>
        <SearchAutocomplete
          helpers={UserSearchHelpers}
          label="Search for users"
          onChange={(item) => {
            if (item.fullDetails) {
              setUserDetails(item.fullDetails);
            } else {
              setUserDetails(null);
            }
          }}
          onNetworkError={(e) =>
            console.log("TODO DO SOMETHING USEFUL HERE", e)
          }
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
