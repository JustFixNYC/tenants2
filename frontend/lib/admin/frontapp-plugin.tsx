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
import { AdminUserInfo } from "./admin-user-info";
import Page from "../ui/page";
import { AdminAuthExpired } from "./admin-auth-expired";

const UserInfo: React.FC<{ email: string }> = ({ email }) => {
  const input = useMemo(
    () => ({
      email,
    }),
    [email]
  );
  const response = useAdminFetch(FrontappUserDetails, input, true);

  if (response.type === "errored") {
    return <p>Alas, an error occurred.</p>;
  } else if (response.type === "loaded") {
    if (!response.output.isVerifiedStaffUser) {
      return <AdminAuthExpired />;
    }
    const { userDetails } = response.output;
    if (!userDetails) {
      return (
        <p>
          The email address {email} does not seem to have an account with us.
        </p>
      );
    }
    return <AdminUserInfo user={userDetails} showPhoneNumber={true} />;
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
          // Not sure why we need to typecast here, but we do.
          const conv = (context as SingleConversationContext).conversation;
          setRecipient(conv.recipient?.handle);
        }
      });
      return () => sub.unsubscribe();
    }, []);

    return (
      <Page title="Front app plugin" className="content">
        {!frontContext ? (
          <p>Waiting for Front...</p>
        ) : recipient ? (
          <UserInfo email={recipient} />
        ) : (
          <p>No conversation selected.</p>
        )}
      </Page>
    );
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
