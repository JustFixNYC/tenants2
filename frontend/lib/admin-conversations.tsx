import React, { useEffect, useContext, useState, useMemo } from 'react';
import { Switch, Route } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations, AdminConversationsVariables } from './queries/AdminConversations';
import { QueryLoaderQuery } from './query-loader-prefetcher';

function useQuery<Input, Output>(query: QueryLoaderQuery<Input, Output>, input: Input): Output|null {
  const [value, setValue] = useState<Output|null>(null);
  const appCtx = useContext(AppContext);
  const { fetch } = appCtx;

  useEffect(() => {
    let isMounted = true;
    const result = query.fetch(fetch, input);
    result.then(v => isMounted && setValue(v));
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

  return <div className="jf-admin-conversations-wrapper">
    <div className="jf-conversation-sidebar">
      {conversations?.output?.map(conv => {
        return <div key={conv.userPhoneNumber}>
          <div>{conv.userPhoneNumber}</div>
          <div>{conv.body}</div>
        </div>
      }) || <p>Loading...</p>}
    </div>
    <div className="jf-current-conversation">
      <p>TODO PUT STUFF HERE</p>
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
