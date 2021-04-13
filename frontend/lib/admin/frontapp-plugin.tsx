import { RouteComponentProps } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
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
import { adminGetUserFullName, AdminUserInfo } from "./admin-user-info";
import Page from "../ui/page";
import { AdminAuthExpired } from "./admin-auth-expired";
import { AdminDirectoryWidget } from "./admin-directory";

type RecipientProps =
  | {
      kind: "email";
      email: string;
    }
  | {
      kind: "phoneNumber";
      phoneNumber: string;
    };

function stringToRecipient(recipient: string): RecipientProps {
  if (/^\+\d\d\d\d\d\d\d\d\d\d\d$/.test(recipient)) {
    return {
      kind: "phoneNumber",
      phoneNumber: recipient,
    };
  }
  return {
    kind: "email",
    email: recipient,
  };
}

const Recipient: React.FC<RecipientProps> = (props) =>
  props.kind === "phoneNumber" ? (
    <>
      phone number <strong>{props.phoneNumber}</strong>
    </>
  ) : (
    <>
      email address <strong>{props.email}</strong>
    </>
  );

const LoadedUserInfo: React.FC<
  FrontappUserDetails & { recipient: RecipientProps }
> = ({ isVerifiedStaffUser, userDetails, recipient }) => {
  if (!isVerifiedStaffUser) {
    return <AdminAuthExpired />;
  }
  if (!userDetails) {
    return (
      <>
        <p>
          The selected conversation's recipient does not seem to have an account
          with us under the <Recipient {...recipient} />.
        </p>
        <p>
          If you have other details about the user available, such as their
          name, you may want to manually search for them using the form below.
        </p>
        <AdminDirectoryWidget />
      </>
    );
  }
  return (
    <>
      <div className="content">
        <h1>{adminGetUserFullName(userDetails)}</h1>
        <AdminUserInfo user={userDetails} showPhoneNumber />
        <hr />
        <p>
          The above information is based on the conversation you have selected
          in Front. If it's not what you're looking for, you can manually search
          using the form below.
        </p>
      </div>
      <AdminDirectoryWidget />
    </>
  );
};

const UserInfo: React.FC<RecipientProps> = (props) => {
  const email = props.kind === "email" ? props.email : undefined;
  const phoneNumber =
    props.kind === "phoneNumber" ? props.phoneNumber : undefined;
  const input: FrontappUserDetailsVariables = useMemo(
    () => ({
      email,
      phoneNumber,
    }),
    [email, phoneNumber]
  );
  const response = useAdminFetch(FrontappUserDetails, input, true);

  return response.type === "errored" ? (
    <p>Alas, a network error occurred.</p>
  ) : response.type === "loaded" ? (
    <LoadedUserInfo {...response.output} recipient={props} />
  ) : (
    <p>Loading...</p>
  );
};

export const FrontappPlugin: React.FC<RouteComponentProps<any>> = staffOnlyView(
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
        ) : (
          <>
            {recipient ? (
              <UserInfo {...stringToRecipient(recipient)} />
            ) : (
              <>
                <p>No conversation selected.</p>
                <AdminDirectoryWidget />
              </>
            )}
          </>
        )}
      </Page>
    );
  }
);
