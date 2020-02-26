import React, { useEffect, useContext, useState, useMemo } from 'react';
import { Switch, Route } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations, AdminConversationsVariables } from './queries/AdminConversations';
import { QueryLoaderQuery } from './query-loader-prefetcher';
import { AdminConversationVariables, AdminConversation } from './queries/AdminConversation';

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

const AdminConversationsPage: React.FC<{}> = (props) => {
  const conversationsInput = useMemo<AdminConversationsVariables>(() => ({
    query: '',
    page: 1,
  }), []);
  const conversations = useQuery(AdminConversations, conversationsInput);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string|null>(null);
  const conversationInput = useMemo<AdminConversationVariables|null>(() => selectedPhoneNumber ? {
    phoneNumber: selectedPhoneNumber,
    page: 1,
  } : null, [selectedPhoneNumber]);
  const conversation = useQuery(AdminConversation, conversationInput);

  return <div className="jf-admin-conversations-wrapper">
    <div className="jf-conversation-sidebar">
      {conversations?.output?.map(conv => {
        return <div key={conv.userPhoneNumber}
                    onClick={() => setSelectedPhoneNumber(conv.userPhoneNumber)}>
          <div>{conv.userPhoneNumber}</div>
          <div>{conv.body}</div>
        </div>
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
