import React, {
  useEffect,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Switch, Route, RouteComponentProps, Link } from "react-router-dom";
import JustfixRoutes from "../justfix-route-info";
import { AppContext } from "../app-context";
import {
  AdminConversations,
  AdminConversationsVariables,
} from "../queries/AdminConversations";
import { QueryLoaderQuery } from "../networking/query-loader-prefetcher";
import {
  AdminConversationVariables,
  AdminConversation,
  AdminConversation_userDetails,
  AdminConversation_output_messages,
} from "../queries/AdminConversation";
import { getQuerystringVar } from "../util/querystring";
import { Helmet } from "react-helmet-async";
import classnames from "classnames";
import { UpdateTextingHistoryMutation } from "../queries/UpdateTextingHistoryMutation";
import { niceAdminTimestamp } from "./admin-util";
import { useRepeatedPromise, useAdminFetch, usePrevious } from "./admin-hooks";
import { staffOnlyView } from "./staff-only-view";
import { useDebouncedValue } from "../util/use-debounced-value";
import { friendlyPhoneNumber } from "../util/util";
import { friendlyDate } from "../util/date-util";
import { AdminUserInfo } from "./admin-user-info";
import { AdminAuthExpired } from "./admin-auth-expired";

const PHONE_QS_VAR = "phone";

const QUERY_QS_VAR = "q";

const REFRESH_INTERVAL_MS = 3000;

const DEBOUNCE_MS = 250;

const AUTH_ERROR = Symbol("authentication error");

export type BaseConversationMessage = {
  sid: string;
  ordering: number;
};

/**
 * Add the second list of messages to the first list, updating any existing entries
 * (rather than creating duplicates).
 *
 * Returns the merged list, sorted by their ordering.
 *
 * This function is non-destructive (it doesn't modify either list).
 */
function mergeMessages<T extends BaseConversationMessage>(
  current: T[],
  toMerge: T[]
): T[] {
  const allMessages = new Map<string, T>();

  for (let msg of current) {
    allMessages.set(msg.sid, msg);
  }

  for (let msg of toMerge) {
    allMessages.set(msg.sid, msg);
  }

  const merged = [...allMessages.values()];

  merged.sort((a, b) => b.ordering - a.ordering);

  return merged;
}

export const mergeConversationMessages = mergeMessages;

function useLatestMessageTimestamp():
  | string
  | null
  | undefined
  | typeof AUTH_ERROR {
  const { fetchWithoutErrorHandling: fetch } = useContext(AppContext);
  return useRepeatedPromise(
    useMemo(
      // TODO: On error, inform the user *non-intrusively* that something is amiss.
      () => async () => {
        const res = await UpdateTextingHistoryMutation.fetch(fetch);
        if (res.output.authError) return AUTH_ERROR;
        return res.output.latestMessage;
      },
      [fetch]
    ),
    REFRESH_INTERVAL_MS
  );
}

type BaseConversationInput = {
  afterOrAt?: number | null;
};

type BaseConversationOutput = {
  output: {
    messages: BaseConversationMessage[];
    hasNextPage: boolean;
  } | null;
};

type UseMergedQueryResult<Output> = {
  loadMore: () => void;
  value: Output | null;
  isLoadingNewInput: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean | undefined;
};

function useMergedQuery<
  Input extends BaseConversationInput,
  Output extends BaseConversationOutput
>(
  query: QueryLoaderQuery<Input, Output>,
  input: Input | null,
  latestTimestamp: string | null | undefined
): UseMergedQueryResult<Output> {
  const firstResults = useAdminFetch(query, input, latestTimestamp);
  const prevFirstResults = usePrevious(firstResults);
  const [loadedInput, setLoadedInput] = useState<Input | null>(null);
  const [afterOrAt, setAfterOrAt] = useState<number | null>(null);
  const moreResultsInput = useMemo<Input | null>(() => {
    return afterOrAt && input ? { ...input, afterOrAt } : null;
  }, [input, afterOrAt]);
  const moreResults = useAdminFetch(
    query,
    moreResultsInput,
    "fake refresh token"
  );
  const prevMoreResults = usePrevious(moreResults);
  const [mergedOutput, setMergedOutput] = useState<Output | null>(null);
  const loadMore = useCallback(() => {
    if (mergedOutput?.output?.messages.length) {
      setAfterOrAt(
        mergedOutput.output.messages[mergedOutput.output.messages.length - 1]
          .ordering
      );
    }
  }, [mergedOutput]);

  useEffect(() => {
    if (prevFirstResults?.type === firstResults.type) return;
    if (firstResults.type === "loading") {
      setAfterOrAt(null);
    } else if (firstResults.type === "loaded" && firstResults.output.output) {
      const isNewInput = input !== loadedInput;
      setLoadedInput(input);
      if (isNewInput || !mergedOutput?.output) {
        setMergedOutput(firstResults.output);
      } else {
        setMergedOutput({
          ...mergedOutput,
          output: {
            ...mergedOutput.output,
            messages: mergeMessages(
              mergedOutput.output.messages,
              firstResults.output.output.messages
            ),
          },
        });
      }
    }
  }, [firstResults, prevFirstResults, mergedOutput, input, loadedInput]);

  useEffect(() => {
    if (
      afterOrAt &&
      moreResults.type === "loaded" &&
      moreResults.type !== prevMoreResults?.type &&
      moreResults.output.output &&
      mergedOutput?.output
    ) {
      setMergedOutput({
        ...mergedOutput,
        output: {
          ...mergedOutput.output,
          messages: mergeMessages(
            mergedOutput.output.messages,
            moreResults.output.output.messages
          ),
          hasNextPage: moreResults.output.output.hasNextPage,
        },
      });
      setAfterOrAt(null);
    }
  }, [afterOrAt, prevMoreResults, moreResults, mergedOutput]);

  return {
    value: mergedOutput,
    isLoadingNewInput: firstResults.type === "loading" && loadedInput !== input,
    loadMore,
    isLoadingMore: moreResults.type === "loading",
    hasNextPage:
      moreResults.type === "loading"
        ? undefined
        : mergedOutput?.output?.hasNextPage,
  };
}

export function makeConversationsURL(
  rawQuery?: string,
  phoneNumber?: string
): string {
  const params = new URLSearchParams();
  rawQuery && params.set(QUERY_QS_VAR, rawQuery);
  phoneNumber && params.set(PHONE_QS_VAR, phoneNumber);
  const qs = params.toString();
  return JustfixRoutes.adminConversations + (qs ? `?${qs}` : "");
}

export function normalizeConversationQuery(query: string): string {
  if (/^[ ()\-\d]+$/.test(query)) {
    // It's a phone number, remove all the non-digit characters.
    query = query.replace(/[^\d]/g, "");
  }
  return query.trim();
}

const LoadMoreButton: React.FC<{
  queryResult: UseMergedQueryResult<any>;
}> = ({ queryResult }) => {
  const className = "button is-text is-small";
  return queryResult.isLoadingMore ? (
    <button disabled className={className}>
      Loading...
    </button>
  ) : queryResult.hasNextPage ? (
    <button className={className} onClick={queryResult.loadMore}>
      Load more
    </button>
  ) : null;
};

const ConversationsSidebar: React.FC<{
  rawQuery: string;
  setRawQuery: (value: string) => void;
  selectedPhoneNumber: string | undefined;
  query: string;
  conversations: UseMergedQueryResult<AdminConversations>;
}> = ({ rawQuery, setRawQuery, query, conversations, selectedPhoneNumber }) => {
  return (
    <div className="jf-conversation-sidebar">
      <input
        className="jf-search"
        type="text"
        placeholder="🔎 Search by name or phone number"
        value={rawQuery}
        onChange={(e) => setRawQuery(e.target.value)}
      />
      {conversations.value ? (
        conversations.value.output ? (
          conversations.value.output.messages.length > 0 ? (
            <>
              {conversations.value.output.messages.map((conv) => {
                return (
                  <Link
                    key={conv.userPhoneNumber}
                    className={classnames("jf-can-be-stale", {
                      "jf-selected":
                        conv.userPhoneNumber === selectedPhoneNumber,
                      "jf-is-stale-result": conversations.isLoadingNewInput,
                    })}
                    to={makeConversationsURL(rawQuery, conv.userPhoneNumber)}
                  >
                    <div className="jf-heading">
                      <div className="jf-tenant">
                        {conv.userFullName ||
                          friendlyPhoneNumber(conv.userPhoneNumber)}{" "}
                        {conv.errorMessage && "❌"}
                      </div>
                      <div className="jf-date">
                        {niceAdminTimestamp(conv.dateSent)}
                      </div>
                    </div>
                    <div className="jf-body">{conv.body}</div>
                  </Link>
                );
              })}
              <LoadMoreButton queryResult={conversations} />
            </>
          ) : (
            <div className="jf-empty-panel">
              <p>
                {conversations.isLoadingNewInput
                  ? "Loading conversations..."
                  : query
                  ? "Alas, your search criteria yielded no results."
                  : "Alas, there are no conversations."}
              </p>
            </div>
          )
        ) : (
          <div className="jf-empty-panel">
            <p>An error occurred when retrieving conversations.</p>
          </div>
        )
      ) : (
        <div className="jf-empty-panel">
          <p>Loading conversations...</p>
        </div>
      )}
    </div>
  );
};

const ConversationMessages: React.FC<{
  messages: AdminConversation_output_messages[];
}> = ({ messages }) => {
  const elements: JSX.Element[] = [];
  let currDate = "";

  const writeCurrDate = () => {
    if (currDate) {
      elements.push(
        <div key={currDate} className="jf-date">
          {currDate}
        </div>
      );
    }
  };

  for (let msg of messages) {
    const date = friendlyDate(new Date(msg.dateSent));
    if (currDate !== date) {
      writeCurrDate();
      currDate = date;
    }

    elements.push(
      <div
        key={msg.sid}
        className={classnames(
          msg.isFromUs ? "jf-from-us" : "jf-to-us",
          "jf-sms"
        )}
      >
        <div
          className="jf-sms-body"
          title={`This message was sent on ${niceAdminTimestamp(msg.dateSent, {
            seconds: true,
          })}.`}
        >
          {msg.body}
        </div>
        {msg.errorMessage && (
          <div className="jf-sms-error">
            Error sending SMS: {msg.errorMessage}
          </div>
        )}
      </div>
    );
  }

  writeCurrDate();

  return <>{elements}</>;
};

function getUserFullName(user: AdminConversation_userDetails): string {
  return [user.firstName, user.lastName].join(" ").trim();
}

const ConversationPanel: React.FC<{
  selectedPhoneNumber: string | undefined;
  conversation: UseMergedQueryResult<AdminConversation>;
  noSelectionMsg: string;
}> = ({ selectedPhoneNumber, conversation, noSelectionMsg }) => {
  const convStalenessClasses = {
    "jf-is-stale-result": conversation.isLoadingNewInput,
    "jf-can-be-stale": true,
  };
  const convMsgs = conversation.value?.output?.messages || [];
  const user = conversation.value?.userDetails;
  const userFullName = user ? getUserFullName(user) : "";

  return (
    <div className="jf-current-conversation">
      {selectedPhoneNumber ? (
        <>
          {conversation.value ? (
            <>
              <div
                className={classnames(
                  "jf-user-details content",
                  convStalenessClasses
                )}
              >
                <h1>
                  Conversation with{" "}
                  {userFullName || friendlyPhoneNumber(selectedPhoneNumber)}
                </h1>
                {user ? (
                  <AdminUserInfo showPhoneNumber={!!userFullName} user={user} />
                ) : (
                  <p>
                    This phone number does not seem to have an account with us.
                  </p>
                )}
              </div>
              <div className={classnames("jf-messages", convStalenessClasses)}>
                {convMsgs.length ? (
                  <ConversationMessages messages={convMsgs} />
                ) : (
                  <p>
                    We have no record of any SMS messages exchanged with this
                    phone number.
                  </p>
                )}
                <LoadMoreButton queryResult={conversation} />
              </div>
            </>
          ) : (
            <div className="jf-empty-panel">
              <p>
                Loading conversation for{" "}
                {friendlyPhoneNumber(selectedPhoneNumber)}...
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="jf-empty-panel">
          <p>{noSelectionMsg}</p>
        </div>
      )}
    </div>
  );
};

const AdminConversationsPageWrapper: React.FC<RouteComponentProps> = staffOnlyView(
  (props) => {
    const latestMsgTimestamp = useLatestMessageTimestamp();

    if (latestMsgTimestamp === AUTH_ERROR) {
      return <AdminAuthExpired />;
    }

    return (
      <AdminConversationsPage
        latestMsgTimestamp={latestMsgTimestamp}
        {...props}
      />
    );
  }
);

const AdminConversationsPage: React.FC<
  RouteComponentProps & {
    latestMsgTimestamp: string | null | undefined;
  }
> = staffOnlyView((props) => {
  const { history, latestMsgTimestamp } = props;
  const selectedPhoneNumber = getQuerystringVar(
    props.location.search,
    PHONE_QS_VAR
  );
  const rawQuery = getQuerystringVar(props.location.search, QUERY_QS_VAR) || "";
  const setRawQuery = useCallback(
    (value: string) => {
      history.replace(makeConversationsURL(value, selectedPhoneNumber));
    },
    [history, selectedPhoneNumber]
  );
  const query = useDebouncedValue(
    normalizeConversationQuery(rawQuery),
    DEBOUNCE_MS
  );
  const conversationsInput = useMemo<AdminConversationsVariables>(
    () => ({ query }),
    [query]
  );
  const conversations = useMergedQuery(
    AdminConversations,
    conversationsInput,
    latestMsgTimestamp
  );
  const conversationInput = useMemo<AdminConversationVariables | null>(
    () =>
      selectedPhoneNumber
        ? {
            phoneNumber: selectedPhoneNumber,
          }
        : null,
    [selectedPhoneNumber]
  );
  const conversation = useMergedQuery(
    AdminConversation,
    conversationInput,
    latestMsgTimestamp
  );
  const noSelectionMsg =
    (conversations?.value?.output?.messages.length || 0) > 0
      ? "Please choose a conversation on the sidebar to the left."
      : "";

  return (
    <div className="jf-admin-conversations-wrapper">
      <Helmet>
        <html className="jf-is-fullscreen-admin-page" />
      </Helmet>
      <ConversationsSidebar
        {...{
          rawQuery,
          setRawQuery,
          query,
          conversations,
          selectedPhoneNumber,
        }}
      />
      <ConversationPanel
        {...{ selectedPhoneNumber, conversation, noSelectionMsg }}
      />
    </div>
  );
});

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route
        path={JustfixRoutes.adminConversations}
        exact
        component={AdminConversationsPageWrapper}
      />
    </Switch>
  );
}
