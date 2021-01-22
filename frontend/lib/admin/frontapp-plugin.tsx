import { Route, RouteComponentProps, Switch } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import JustfixRoutes from "../justfix-route-info";
import Front, {
  ApplicationContext,
  SingleConversationContext,
} from "@frontapp/plugin-sdk";
import { staffOnlyView } from "./staff-only-view";
import { useAdminFetch } from "./admin-hooks";
import {
  FrontappUserDetails,
  FrontappUserDetailsVariables,
} from "../queries/FrontappUserDetails";
import { AdminUserInfo } from "./admin-user-info";
import Page from "../ui/page";
import { AdminAuthExpired } from "./admin-auth-expired";

const LoadedUserInfo: React.FC<FrontappUserDetails & { email: string }> = ({
  isVerifiedStaffUser,
  userDetails,
  email,
}) => {
  if (!isVerifiedStaffUser) {
    return <AdminAuthExpired />;
  }
  if (!userDetails) {
    return (
      <p>
        The selected conversation's recipient does not seem to have an account
        with us under the email address <strong>{email}</strong>.
      </p>
    );
  }
  return <AdminUserInfo user={userDetails} showPhoneNumber showName />;
};

const UserInfo: React.FC<{ email: string }> = ({ email }) => {
  const input: FrontappUserDetailsVariables = useMemo(
    () => ({
      email,
    }),
    [email]
  );
  const response = useAdminFetch(FrontappUserDetails, input, true);

  return response.type === "errored" ? (
    <p>Alas, a network error occurred.</p>
  ) : response.type === "loaded" ? (
    <LoadedUserInfo {...response.output} email={email} />
  ) : (
    <p>Loading...</p>
  );
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
