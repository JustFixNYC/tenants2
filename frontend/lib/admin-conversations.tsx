import React from 'react';
import { Switch, Route } from "react-router-dom";
import Routes from "./routes";

const AdminConversationsPage: React.FC<{}> = (props) => {
  // TODO: If the user isn't staff, redirect them to login.
  return <p>TODO: Insert content here.</p>;
};

export default function AdminConversationsRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.adminConversations} exact component={AdminConversationsPage} />
    </Switch>
  );
}
