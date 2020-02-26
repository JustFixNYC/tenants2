import React, { useEffect, useContext, useState } from 'react';
import { Switch, Route } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations, AdminConversations_output } from './queries/AdminConversations';

const AdminConversationsPage: React.FC<{}> = (props) => {
  const appCtx = useContext(AppContext);
  const [conversations, setConversations] = useState<AdminConversations_output[]|null>(null);
  const { fetch } = appCtx;

  useEffect(() => {
    let isMounted = true;
    const result = AdminConversations.fetch(appCtx.fetch, {
      query: '',
      page: 1,
    });
    result.then(convos => isMounted && setConversations(convos.output));
    return () => { isMounted = false; };
  }, [fetch]);

  return <div>
    {conversations ? conversations.map(conv => {
      return <div key={conv.userPhoneNumber}>
        <div>{conv.userPhoneNumber}</div>
        <div>{conv.body}</div>
      </div>
    }) : <p>Loading...</p>}
  </div>;
};

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.adminConversations} exact component={AdminConversationsPage} />
    </Switch>
  );
}
