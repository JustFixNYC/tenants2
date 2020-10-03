import { Route, RouteComponentProps, Switch } from "react-router-dom";
import React, { useEffect, useState } from "react";
import JustfixRoutes from "../justfix-routes";
import Front, {
  ApplicationContext,
  SingleConversationContext,
} from "@frontapp/plugin-sdk";
import { staffOnlyView } from "./staff-only-view";

const FrontappPlugin: React.FC<RouteComponentProps<any>> = staffOnlyView(
  (props) => {
    const [recipient, setRecipient] = useState<string>();
    const [frontContext, setFrontContext] = useState<
      Pick<ApplicationContext, "openUrl">
    >();

    useEffect(() => {
      const sub = Front.contextUpdates.subscribe((context) => {
        setFrontContext(context);
        if (context.type === "singleConversation") {
          const conv = (context as SingleConversationContext).conversation;
          setRecipient(conv.recipient?.handle);
        }
      });
      return () => sub.unsubscribe();
    }, []);

    if (!frontContext) {
      return <p>Waiting for Front...</p>;
    } else if (recipient) {
      return <p>Your recipient is {recipient}.</p>;
    }
    return <p>No conversation selected.</p>;
  }
);

const FrontappPluginRoutes: React.FC<{}> = () => {
  return (
    <Switch>
      <Route
        component={FrontappPlugin}
        path={JustfixRoutes.adminFrontappPlugin}
        exact
      />
    </Switch>
  );
};

export default FrontappPluginRoutes;
