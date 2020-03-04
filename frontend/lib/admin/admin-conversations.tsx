import React, { useEffect, useContext, useState, useMemo, useCallback } from 'react';
import { Switch, Route, RouteComponentProps, Link } from "react-router-dom";
import Routes from "../routes";
import { AppContext } from '../app-context';
import { AdminConversations, AdminConversationsVariables } from '../queries/AdminConversations';
import { QueryLoaderQuery } from '../query-loader-prefetcher';
import { AdminConversationVariables, AdminConversation } from '../queries/AdminConversation';
import { getQuerystringVar } from '../querystring';
import { Helmet } from 'react-helmet-async';
import { whoOwnsWhatURL } from '../wow-link';
import classnames from 'classnames';
import { UpdateTextingHistoryMutation } from '../queries/UpdateTextingHistoryMutation';
import { niceAdminTimestamp, friendlyAdminPhoneNumber } from './admin-util';
import { useRepeatedPromise, useAdminFetch, usePrevious, useDebouncedValue } from './admin-hooks';
import { staffOnlyView } from './staff-only-view';

const PHONE_QS_VAR = 'phone';

const REFRESH_INTERVAL_MS = 3000;

const DEBOUNCE_MS = 250;

export type BaseConversationMessage = {
  sid: string,
  ordering: number,
};

/**
 * Add the second list of messages to the first list, updating any existing entries
 * (rather than creating duplicates).
 * 
 * Returns the merged list, sorted by their ordering.
 * 
 * This function is non-destructive (it doesn't modify either list).
 */
function mergeMessages<T extends BaseConversationMessage>(current: T[], toMerge: T[]): T[] {
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

function useLatestMessageTimestamp(): string|null|undefined {
  const { fetchWithoutErrorHandling: fetch } = useContext(AppContext);
  return useRepeatedPromise(
    useMemo(
      // TODO: On error, inform the user *non-intrusively* that something is amiss.
      () => async () => (await UpdateTextingHistoryMutation.fetch(fetch)).output.latestMessage,
      [fetch]
    ),
    REFRESH_INTERVAL_MS
  );
}

type BaseConversationInput = {
  afterOrAt?: number|null,
};

type BaseConversationOutput = {
  output: {
    messages: BaseConversationMessage[],
    hasNextPage: boolean,
  } | null,
};

type UseMergedQueryResult<Output> = {
  loadMore: () => void,
  value: Output|null,
  isLoadingNewInput: boolean,
  isLoadingMore: boolean,
  hasNextPage: boolean|undefined,
};

function useMergedQuery<Input extends BaseConversationInput, Output extends BaseConversationOutput>(
  query: QueryLoaderQuery<Input, Output>,
  input: Input|null,
  latestTimestamp: string|null|undefined,
): UseMergedQueryResult<Output> {
  const firstResults = useAdminFetch(query, input, latestTimestamp);
  const prevFirstResults = usePrevious(firstResults);
  const [loadedInput, setLoadedInput] = useState<Input|null>(null);
  const [afterOrAt, setAfterOrAt] = useState<number|null>(null);
  const moreResultsInput = useMemo<Input|null>(() => {
    return afterOrAt && input ? {...input, afterOrAt} : null
  }, [input, afterOrAt]);
  const moreResults = useAdminFetch(query, moreResultsInput, 'fake refresh token');
  const prevMoreResults = usePrevious(moreResults);
  const [mergedOutput, setMergedOutput] = useState<Output|null>(null);
  const loadMore = useCallback(() => {
    if (mergedOutput?.output?.messages.length) {
      setAfterOrAt(mergedOutput.output.messages[mergedOutput.output.messages.length - 1].ordering);
    }
  }, [mergedOutput]);

  useEffect(() => {
    if (prevFirstResults?.type === firstResults.type) return;
    if (firstResults.type === 'loading') {
      setAfterOrAt(null);
    } else if (firstResults.type === 'loaded' && firstResults.output.output) {
      const isNewInput = input !== loadedInput;
      setLoadedInput(input);
      if (isNewInput || !mergedOutput?.output) {
        setMergedOutput(firstResults.output);
      } else {
        setMergedOutput({
          ...mergedOutput,
          output: {
            ...mergedOutput.output,
            messages: mergeMessages(mergedOutput.output.messages, firstResults.output.output.messages),
          },
        });
      }
    }
  }, [firstResults, prevFirstResults, mergedOutput, input, loadedInput]);

  useEffect(() => {
    if (afterOrAt && moreResults.type === 'loaded' &&
        moreResults.type !== prevMoreResults?.type &&
        moreResults.output.output && mergedOutput?.output) {
      setMergedOutput({
        ...mergedOutput,
        output: {
          ...mergedOutput.output,
          messages: mergeMessages(mergedOutput.output.messages, moreResults.output.output.messages),
          hasNextPage: moreResults.output.output.hasNextPage,
        },
      });
      setAfterOrAt(null);
    }
  }, [afterOrAt, prevMoreResults, moreResults, mergedOutput]);

  return {
    value: mergedOutput,
    isLoadingNewInput: firstResults.type === 'loading' && (loadedInput !== input),
    loadMore,
    isLoadingMore: moreResults.type === 'loading',
    hasNextPage: moreResults.type === 'loading' ? undefined : mergedOutput?.output?.hasNextPage,
  };
}

export function makeConversationURL(phoneNumber: string): string {
  return Routes.adminConversations + `?${PHONE_QS_VAR}=${encodeURIComponent(phoneNumber)}`;
}

export function normalizeConversationQuery(query: string): string {
  if (/^[ ()\-\d]+$/.test(query)) {
    // It's a phone number, remove all the non-digit characters.
    query = query.replace(/[^\d]/g, '');
  }
  return query.trim();
}

const LoadMoreButton: React.FC<{
  queryResult: UseMergedQueryResult<any>
}> = ({queryResult}) => {
  const className = "button is-text is-small";
  return queryResult.isLoadingMore
    ? <button disabled className={className}>Loading...</button>
    : queryResult.hasNextPage ? <button className={className} onClick={queryResult.loadMore}>Load more</button>
      : null;
};

const ConversationsSidebar: React.FC<{
  rawQuery: string,
  setRawQuery: (value: string) => void,
  selectedPhoneNumber: string|undefined,
  query: string,
  conversations: UseMergedQueryResult<AdminConversations>,
}> = ({rawQuery, setRawQuery, query, conversations, selectedPhoneNumber}) => {
  return (
    <div className="jf-conversation-sidebar">
      <input className="jf-search" type="text" placeholder="🔎 Search by name or phone number"
             value={rawQuery} onChange={e => setRawQuery(e.target.value)} />
      {conversations.value ?
        conversations.value.output ?
          conversations.value.output.messages.length > 0 ? <>
            {conversations.value.output.messages.map(conv => {
              return <Link key={conv.userPhoneNumber}
                          className={classnames('jf-can-be-stale', {
                            'jf-selected': conv.userPhoneNumber === selectedPhoneNumber,
                            'jf-is-stale-result': conversations.isLoadingNewInput,
                          })}
                          to={makeConversationURL(conv.userPhoneNumber)}>
                <div className="jf-heading">
                  <div className="jf-tenant">{conv.userFullName || friendlyAdminPhoneNumber(conv.userPhoneNumber)} {conv.errorMessage && '❌'}</div>
                  <div className="jf-date">{niceAdminTimestamp(conv.dateSent)}</div>
                </div>
                <div className="jf-body">{conv.body}</div>
              </Link>
            })}
            <LoadMoreButton queryResult={conversations} />
          </> : <div className="jf-empty-panel"><p>{
              conversations.isLoadingNewInput ?
                "Loading conversations..."
              : query ?
                "Alas, your search criteria yielded no results."
              : "Alas, there are no conversations."
            }</p></div>
        : <div className="jf-empty-panel"><p>An error occurred when retrieving conversations.</p></div>
      : <div className="jf-empty-panel"><p>Loading conversations...</p></div>}
    </div>
  );
};

const ConversationPanel: React.FC<{
  selectedPhoneNumber: string|undefined,
  conversation: UseMergedQueryResult<AdminConversation>,
  noSelectionMsg: string,
}> = ({selectedPhoneNumber, conversation, noSelectionMsg}) => {
  const convStalenessClasses = {'jf-is-stale-result': conversation.isLoadingNewInput, 'jf-can-be-stale': true};
  const convMsgs = conversation.value?.output.messages || [];
  const user = conversation.value?.userDetails;
  const userFullName = [user?.firstName || '', user?.lastName || ''].join(' ').trim();

  return (
    <div className="jf-current-conversation">
      {selectedPhoneNumber ? <>
        {conversation.value ? <>
          <div className={classnames("jf-user-details content", convStalenessClasses)}>
            <h1>Conversation with {userFullName || friendlyAdminPhoneNumber(selectedPhoneNumber)}</h1>
            {user ? <>
              {userFullName && <p>This user's phone number is {friendlyAdminPhoneNumber(selectedPhoneNumber)}.</p>}
              {user.onboardingInfo && <p>The user's signup intent is {user.onboardingInfo.signupIntent}.</p>}
              {user.letterRequest && <p>The user completed a letter of complaint on {niceAdminTimestamp(user.letterRequest.updatedAt)}.</p>}
              <a href={user.adminUrl} className="button is-small" target="_blank">Edit user</a>
              {user.onboardingInfo?.padBbl &&
                <a href={whoOwnsWhatURL(user.onboardingInfo.padBbl)} className="button is-small" target="_blank" rel="noopener noreferrer">View user's building in WoW</a>}
            </> : <p>This phone number does not seem to have an account with us.</p>}
          </div>
          <div className={classnames("jf-messages", convStalenessClasses)} >
            {convMsgs.length ? convMsgs.map(msg => {
              return <div key={msg.sid} className={classnames(msg.isFromUs ? 'jf-from-us' : 'jf-to-us', 'jf-sms')}>
                <div className="jf-sms-body"
                     title={`This message was sent on ${niceAdminTimestamp(msg.dateSent, {seconds: true})}.`}>
                  {msg.body}
                </div>
                {msg.errorMessage && <div className="jf-sms-error">Error sending SMS: {msg.errorMessage}</div>}
              </div>
            }) : <p>We have no record of any SMS messages exchanged with this phone number.</p>}
            <LoadMoreButton queryResult={conversation} />
          </div>
        </> : <div className="jf-empty-panel"><p>Loading conversation for {friendlyAdminPhoneNumber(selectedPhoneNumber)}...</p></div>}
      </> : <div className="jf-empty-panel"><p>{noSelectionMsg}</p></div>}
    </div>
  );
};

const AdminConversationsPage: React.FC<RouteComponentProps> = staffOnlyView((props) => {
  const selectedPhoneNumber = getQuerystringVar(props.location.search, PHONE_QS_VAR);
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebouncedValue(normalizeConversationQuery(rawQuery), DEBOUNCE_MS);
  const conversationsInput = useMemo<AdminConversationsVariables>(() => ({query}), [query]);
  const latestMsgTimestamp = useLatestMessageTimestamp();
  const conversations = useMergedQuery(AdminConversations, conversationsInput, latestMsgTimestamp);
  const conversationInput = useMemo<AdminConversationVariables|null>(() => selectedPhoneNumber ? {
    phoneNumber: selectedPhoneNumber,
  } : null, [selectedPhoneNumber]);
  const conversation = useMergedQuery(AdminConversation, conversationInput, latestMsgTimestamp);
  const noSelectionMsg = (conversations?.value?.output?.messages.length || 0) > 0
    ? "Please choose a conversation on the sidebar to the left." : "";

  return <div className="jf-admin-conversations-wrapper">
    <Helmet>
      <html className="jf-is-fullscreen-admin-page"/>
    </Helmet>
    <ConversationsSidebar {...{rawQuery, setRawQuery, query, conversations, selectedPhoneNumber}} />
    <ConversationPanel {...{selectedPhoneNumber, conversation, noSelectionMsg}} />
  </div>;
});

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.adminConversations} exact component={AdminConversationsPage} />
    </Switch>
  );
}
