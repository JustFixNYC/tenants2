import React, { useEffect, useContext, useState } from 'react';
import { Switch, Route } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations } from './queries/AdminConversations';
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
  }, [fetch]);

  return value;
}

const AdminConversationsPage: React.FC<{}> = (props) => {
  const conversations = useQuery(AdminConversations, { query: '', page: 1 });

  return <div>
    {conversations?.output?.map(conv => {
      return <div key={conv.userPhoneNumber}>
        <div>{conv.userPhoneNumber}</div>
        <div>{conv.body}</div>
      </div>
    }) || <p>Loading...</p>}
  </div>;
};

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.adminConversations} exact component={AdminConversationsPage} />
    </Switch>
  );
}
