import React, { useEffect, useContext, useState, useMemo } from 'react';
import { Switch, Route, RouteComponentProps, Link } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations, AdminConversationsVariables } from './queries/AdminConversations';
import { QueryLoaderQuery } from './query-loader-prefetcher';
import { AdminConversationVariables, AdminConversation } from './queries/AdminConversation';
import { getQuerystringVar } from './querystring';

const PHONE_QS_VAR = 'phone';

function useQuery<Input, Output>(query: QueryLoaderQuery<Input, Output>, input: Input|null): Output|null {
  const [value, setValue] = useState<Output|null>(null);
  const appCtx = useContext(AppContext);
  const { fetch } = appCtx;

  useEffect(() => {
    let isMounted = true;
    if (input !== null) {
      const result = query.fetch(fetch, input);
      result.then(v => isMounted && setValue(v));
    }
    return () => { isMounted = false; };
  }, [fetch, input]);

  return value;
}

function makeConversationURL(phoneNumber: string): string {
  return Routes.adminConversations + `?${PHONE_QS_VAR}=${encodeURIComponent(phoneNumber)}`;
}

function friendlyPhoneNumber(phoneNumber: string): string {
  const match = phoneNumber.match(/^\+1(\d\d\d)(\d\d\d)(\d\d\d\d)$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
}

const AdminConversationsPage: React.FC<RouteComponentProps> = (props) => {
  const selectedPhoneNumber = getQuerystringVar(props.location.search, PHONE_QS_VAR);
  const conversationsInput = useMemo<AdminConversationsVariables>(() => ({
    query: '',
    page: 1,
  }), []);
  const conversations = useQuery(AdminConversations, conversationsInput);
  const conversationInput = useMemo<AdminConversationVariables|null>(() => selectedPhoneNumber ? {
    phoneNumber: selectedPhoneNumber,
    page: 1,
  } : null, [selectedPhoneNumber]);
  const conversation = useQuery(AdminConversation, conversationInput);

  return <div className="jf-admin-conversations-wrapper">
    <div className="jf-conversation-sidebar">
      {conversations?.output?.map(conv => {
        return <Link key={conv.userPhoneNumber}
                     className={conv.userPhoneNumber === selectedPhoneNumber ? 'jf-selected' : ''}
                     to={makeConversationURL(conv.userPhoneNumber)}>
          <div className="jf-tenant">{conv.userFullName || friendlyPhoneNumber(conv.userPhoneNumber)}</div>
          <div className="jf-body">{conv.body}</div>
        </Link>
      }) || <p>Loading...</p>}
    </div>
    <div className="jf-current-conversation">
      {conversation?.output?.map(msg => {
        return <div key={msg.sid} className={msg.isFromUs ? 'jf-from-us' : 'jf-to-us'}>
          <div title={`This message was sent on ${msg.dateSent}.`}>
            {msg.body}
          </div>
        </div>
      })}
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
