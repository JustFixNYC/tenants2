import { Route, RouteComponentProps, Switch } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import JustfixRoutes from "../justfix-routes";
import Front, {
  ApplicationContext,
  SingleConversationContext,
} from "@frontapp/plugin-sdk";
import { staffOnlyView } from "./staff-only-view";
import { useAdminFetch } from "./admin-hooks";
import { FrontappUserDetails } from "../queries/FrontappUserDetails";

const UserInfo: React.FC<{ email: string }> = ({ email }) => {
  const input = useMemo(
    () => ({
      email,
    }),
    [email]
  );
  const response = useAdminFetch(
    FrontappUserDetails,
    input,
    "fake refresh token"
  );

  if (response.type === "errored") {
    return <p>Alas, an error occurred.</p>;
  } else if (response.type === "loaded") {
    const { userDetails } = response.output;
    if (!userDetails) {
      return (
        <p>
          Alas, no information related to {email} is in the tenant platform.
        </p>
      );
    }
    return (
      <p>
        The user's username is {userDetails.username}, their email is {email}.
      </p>
    );
  }
  return <p>Loading...</p>;
};

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
      return <UserInfo email={recipient} />;
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
