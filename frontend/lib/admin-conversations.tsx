import React, { useEffect, useContext, useState, useMemo, useRef } from 'react';
import { Switch, Route, RouteComponentProps, Link } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations, AdminConversationsVariables } from './queries/AdminConversations';
import { QueryLoaderQuery } from './query-loader-prefetcher';
import { AdminConversationVariables, AdminConversation } from './queries/AdminConversation';
import { getQuerystringVar } from './querystring';
import { Helmet } from 'react-helmet-async';
import { whoOwnsWhatURL } from './wow-link';
import classnames from 'classnames';
import { UpdateTextingHistoryMutation } from './queries/UpdateTextingHistoryMutation';

const PHONE_QS_VAR = 'phone';

const REFRESH_INTERVAL_MS = 3000;

const DEBOUNCE_MS = 250;

type UseQueryResult<Output> = {
  value: Output|null,
  isLoading: boolean
};

function niceTimestamp(isoDate: string): string {
  const date = new Date(Date.parse(isoDate));
  const localeDate = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return localeDate.replace(/(\:\d\d) /, ' ');
}

function useLatestMessageTimestamp(): string|null|undefined {
  const [value, setValue] = useState<string|undefined>(undefined);
  const { fetch } = useContext(AppContext);

  useEffect(() => {
    let isMounted = true;
    let refreshTimeout: number|null = null;

    const refreshData = async () => {
      try {
        const result = await UpdateTextingHistoryMutation.fetch(fetch);
        isMounted && setValue(result.output.latestMessage);
      } finally {
        if (isMounted) {
          refreshTimeout = window.setTimeout(refreshData, REFRESH_INTERVAL_MS);
        }
      }
    };

    // TODO: Do something if this throws?
    refreshData();

    return () => {
      isMounted = false;
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
    };
  }, [fetch]);

  return value;
}

// https://blog.logrocket.com/how-to-get-previous-props-state-with-react-hooks/
function usePrevious<T>(value: T): T|undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function useQuery<Input, Output>(
  query: QueryLoaderQuery<Input, Output>,
  input: Input|null,
  latestTimestamp: string|null|undefined,
): UseQueryResult<Output> {
  const [value, setValue] = useState<Output|null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const prevInput = usePrevious(input);
  const { fetch } = useContext(AppContext);

  useEffect(() => {
    let isMounted = true;
    let debounceTimeout: null|number = null;
    if (input !== null) {
      if (input !== prevInput) {
        setIsLoading(true);
      }

      if (latestTimestamp !== undefined) {
        debounceTimeout = window.setTimeout(() => {
          const result = query.fetch(fetch, input);
          // console.log("LOAD!", latestTimestamp, JSON.stringify(input), JSON.stringify(prevInput));
          result.then(v => {
            if (isMounted) {
              setValue(v);
              setIsLoading(false);
            }
          });
          // TODO: Deal w/ exceptions.
        }, DEBOUNCE_MS);
      }
    }
    return () => {
      isMounted = false;
      if (debounceTimeout !== null) {
        window.clearTimeout(debounceTimeout);
      }
    };
  }, [fetch, input, prevInput, latestTimestamp]);

  return {value, isLoading};
}

function makeConversationURL(phoneNumber: string): string {
  return Routes.adminConversations + `?${PHONE_QS_VAR}=${encodeURIComponent(phoneNumber)}`;
}

function friendlyPhoneNumber(phoneNumber: string): string {
  const match = phoneNumber.match(/^\+1(\d\d\d)(\d\d\d)(\d\d\d\d)$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
}

function normalizeQuery(query: string): string {
  if (/^[ ()\-\d]+$/.test(query)) {
    // It's a phone number, remove all the non-digit characters.
    query = query.replace(/[^\d]/g, '');
  }
  return query.trim();
}

const AdminConversationsPage: React.FC<RouteComponentProps> = (props) => {
  const selectedPhoneNumber = getQuerystringVar(props.location.search, PHONE_QS_VAR);
  const [rawQuery, setRawQuery] = useState('');
  const query = normalizeQuery(rawQuery);
  const conversationsInput = useMemo<AdminConversationsVariables>(() => ({
    query,
    page: 1,
  }), [query]);
  const latestMsgTimestamp = useLatestMessageTimestamp();
  const conversations = useQuery(AdminConversations, conversationsInput, latestMsgTimestamp);
  const conversationInput = useMemo<AdminConversationVariables|null>(() => selectedPhoneNumber ? {
    phoneNumber: selectedPhoneNumber,
    page: 1,
  } : null, [selectedPhoneNumber]);
  const conversation = useQuery(AdminConversation, conversationInput, latestMsgTimestamp);
  const convStalenessClasses = {'jf-is-stale-result': conversation.isLoading, 'jf-can-be-stale': true};
  const convMsgs = conversation.value?.output || [];
  const user = conversation.value?.userDetails;
  const userFullName = [user?.firstName || '', user?.lastName || ''].join(' ').trim();

  return <div className="jf-admin-conversations-wrapper">
    <Helmet>
      <html className="jf-is-fullscreen-admin-page"/>
    </Helmet>
    <div className="jf-conversation-sidebar">
      <input className="jf-search" type="text" placeholder="🔎 Search by name or phone number"
             value={rawQuery} onChange={e => setRawQuery(e.target.value)} />
      {conversations.value ?
        conversations.value.output ?
          conversations.value.output.length > 0 ?
            conversations.value.output.map(conv => {
              return <Link key={conv.userPhoneNumber}
                          className={classnames('jf-can-be-stale', {
                            'jf-selected': conv.userPhoneNumber === selectedPhoneNumber,
                            'jf-is-stale-result': conversations.isLoading,
                          })}
                          to={makeConversationURL(conv.userPhoneNumber)}>
                <div className="jf-heading">
                  <div className="jf-tenant">{conv.userFullName || friendlyPhoneNumber(conv.userPhoneNumber)}</div>
                  <div className="jf-date">{niceTimestamp(conv.dateSent)}</div>
                </div>
                <div className="jf-body">{conv.body}</div>
              </Link>
            })
          : <div className="jf-empty-panel"><p>{
              conversations.isLoading ?
                "Loading conversations..."
              : query ?
                "Alas, your search criteria yielded no results."
              : "Alas, there are no conversations."
            }</p></div>
        : <div className="jf-empty-panel"><p>An error occurred when retrieving conversations.</p></div>
      : <div className="jf-empty-panel"><p>Loading conversations...</p></div>}
    </div>
    <div className="jf-current-conversation">
      {selectedPhoneNumber ? <>
        {conversation.value ? <>
          <div className={classnames("jf-user-details content", convStalenessClasses)}>
            <h1>Conversation with {userFullName || friendlyPhoneNumber(selectedPhoneNumber)}</h1>
            {user ? <>
              {userFullName && <p>This user's phone number is {friendlyPhoneNumber(selectedPhoneNumber)}.</p>}
              {user.onboardingInfo && <p>The user's signup intent is {user.onboardingInfo.signupIntent}.</p>}
              {user.letterRequest && <p>The user completed a letter of complaint on {niceTimestamp(user.letterRequest.updatedAt)}.</p>}
              <a href={user.adminUrl} className="button is-small" target="_blank">Edit user</a>
              {user.onboardingInfo?.padBbl &&
                <a href={whoOwnsWhatURL(user.onboardingInfo.padBbl)} className="button is-small" target="_blank" rel="noopener noreferrer">View user's building in WoW</a>}
            </> : <p>This phone number does not seem to have an account with us.</p>}
          </div>
          <div className={classnames("jf-messages", convStalenessClasses)} >
            {convMsgs.length ? convMsgs.map(msg => {
              return <div key={msg.sid} className={msg.isFromUs ? 'jf-from-us' : 'jf-to-us'}>
                <div title={`This message was sent on ${niceTimestamp(msg.dateSent)}.`}>
                  {msg.body}
                </div>
              </div>
            }) : <p>We have no record of any SMS messages exchanged with this phone number.</p>}
          </div>
        </> : <div className="jf-empty-panel"><p>Loading conversation for {friendlyPhoneNumber(selectedPhoneNumber)}...</p></div>}
      </> : <div className="jf-empty-panel"><p>{
        (conversations?.value?.output?.length || 0) > 0 && "Please choose a conversation on the sidebar to the left."
      }</p></div>}
    </div>
  </div>;
};

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.adminConversations} exact component={AdminConversationsPage} />
    </Switch>
  );
}
