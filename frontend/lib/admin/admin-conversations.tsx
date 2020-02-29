import React, { useEffect, useContext, useState, useMemo, useRef } from 'react';
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

const PHONE_QS_VAR = 'phone';

const REFRESH_INTERVAL_MS = 3000;

const DEBOUNCE_MS = 250;

type UseQueryResult<Output> = {
  value: Output|null,
  isLoading: boolean
};

type NiceTimestampOptions = Partial<{
  seconds: boolean,
}>;

function niceTimestamp(isoDate: string, options: NiceTimestampOptions = {}): string {
  const date = new Date(Date.parse(isoDate));
  const localeDate = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return options.seconds ? localeDate : localeDate.replace(/(\:\d\d) /, ' ');
}

function useRepeatedPromise<T>(factory: () => Promise<T>, msInterval: number): T|undefined {
  const [value, setValue] = useState<T|undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    let refreshTimeout: number|null = null;

    const refreshValue = async () => {
      refreshTimeout = null;
      try {
        const result = await factory();
        isActive && setValue(result);
      } finally {
        if (isActive) {
          refreshTimeout = window.setTimeout(refreshValue, msInterval);
        }
      }
    };

    // TODO: Do something if this throws?
    refreshValue();

    return () => {
      isActive = false;
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
    };
  }, [factory, msInterval]);

  return value;
}

function useLatestMessageTimestamp(): string|null|undefined {
  const { fetch } = useContext(AppContext);
  return useRepeatedPromise(
    useMemo(
      () => async () => (await UpdateTextingHistoryMutation.fetch(fetch)).output.latestMessage,
      [fetch]
    ),
    REFRESH_INTERVAL_MS
  );
}

type FetchState<Output> = 
  {type: 'idle'} |
  {type: 'loading'} |
  {type: 'loaded', output: Output} |
  {type: 'errored', error: Error};

const FETCH_STATE_IDLE: FetchState<any> = {type: 'idle'};

function useFetch<Input, Output>(
  query: QueryLoaderQuery<Input, Output>,
  input: Input|null,
  refreshToken: any,
): FetchState<Output> {
  const [state, setState] = useState<FetchState<Output>>(FETCH_STATE_IDLE);
  const { fetch } = useContext(AppContext);

  useEffect(() => {
    if (input === null || !refreshToken) {
      setState(FETCH_STATE_IDLE);
      return;
    }
    let isActive = true;

    // console.log("FETCH", input);
    setState({type: 'loading'});
    query.fetch(fetch, input).then(output => {
      isActive && setState({type: 'loaded', output});
    }).catch(error => {
      isActive && setState({type: 'errored', error});
    });
    return () => {
      isActive = false;
    };
  }, [fetch, query, input, refreshToken]);

  return state;
};

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    let timeout: number|null = null;

    if (value !== debouncedValue) {
      timeout = window.setTimeout(() => {
        timeout = null;
        setDebouncedValue(value);
      }, ms);
    }

    return () => {
      timeout !== null && clearTimeout(timeout);
    };
  }, [debouncedValue, ms, value]);

  return debouncedValue;
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
  const fetchState = useFetch(query, input, latestTimestamp);
  const [latestInput, setLatestInput] = useState<Input|null>(null);
  const [latestOutput, setLatestOutput] = useState<Output|null>(null);
  const prevFetchState = usePrevious(fetchState);

  useEffect(() => {
    if ((prevFetchState && prevFetchState.type === 'loading') && fetchState.type === 'loaded') {
      setLatestOutput(fetchState.output);
      setLatestInput(input);
    }
  });

  const isRefreshing = input === latestInput;
  const isLoading = fetchState.type === 'loading' && !isRefreshing;

  return {
    value: latestOutput,
    isLoading,
  };
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

const ConversationsSidebar: React.FC<{
  rawQuery: string,
  setRawQuery: (value: string) => void,
  selectedPhoneNumber: string|undefined,
  query: string,
  conversations: UseQueryResult<AdminConversations>,
}> = ({rawQuery, setRawQuery, query, conversations, selectedPhoneNumber}) => {
  return (
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
                  <div className="jf-tenant">{conv.userFullName || friendlyPhoneNumber(conv.userPhoneNumber)} {conv.errorMessage && '❌'}</div>
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
  );
};

const ConversationPanel: React.FC<{
  selectedPhoneNumber: string|undefined,
  conversation: UseQueryResult<AdminConversation>,
  noSelectionMsg: string,
}> = ({selectedPhoneNumber, conversation, noSelectionMsg}) => {
  const convStalenessClasses = {'jf-is-stale-result': conversation.isLoading, 'jf-can-be-stale': true};
  const convMsgs = conversation.value?.output || [];
  const user = conversation.value?.userDetails;
  const userFullName = [user?.firstName || '', user?.lastName || ''].join(' ').trim();

  return (
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
              return <div key={msg.sid} className={classnames(msg.isFromUs ? 'jf-from-us' : 'jf-to-us', 'jf-sms')}>
                <div className="jf-sms-body"
                     title={`This message was sent on ${niceTimestamp(msg.dateSent, {seconds: true})}.`}>
                  {msg.body}
                </div>
                {msg.errorMessage && <div className="jf-sms-error">Error sending SMS: {msg.errorMessage}</div>}
              </div>
            }) : <p>We have no record of any SMS messages exchanged with this phone number.</p>}
          </div>
        </> : <div className="jf-empty-panel"><p>Loading conversation for {friendlyPhoneNumber(selectedPhoneNumber)}...</p></div>}
      </> : <div className="jf-empty-panel"><p>{noSelectionMsg}</p></div>}
    </div>
  );
};

const AdminConversationsPage: React.FC<RouteComponentProps> = (props) => {
  const selectedPhoneNumber = getQuerystringVar(props.location.search, PHONE_QS_VAR);
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebouncedValue(normalizeQuery(rawQuery), DEBOUNCE_MS);
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
  const noSelectionMsg = (conversations?.value?.output?.length || 0) > 0
    ? "Please choose a conversation on the sidebar to the left." : "";

  return <div className="jf-admin-conversations-wrapper">
    <Helmet>
      <html className="jf-is-fullscreen-admin-page"/>
    </Helmet>
    <ConversationsSidebar {...{rawQuery, setRawQuery, query, conversations, selectedPhoneNumber}} />
    <ConversationPanel {...{selectedPhoneNumber, conversation, noSelectionMsg}} />
  </div>;
};

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.adminConversations} exact component={AdminConversationsPage} />
    </Switch>
  );
}
