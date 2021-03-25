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
import { AdminUserInfo } from "./admin-user-info";
import Page from "../ui/page";
import { AdminAuthExpired } from "./admin-auth-expired";

// Ideally this should be a hard reference passed to us
// by the server, but this URL is probably never going
// to change and I'm feeling kind of lazy. Also,
// this breaking won't be the end of the world. -AV
const ADMIN_SEARCH_URL = "/admin/users/justfixuser/";

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

const ManualSearchForm: React.FC<{}> = () => (
  <form action={ADMIN_SEARCH_URL} method="GET" target="_blank">
    <div className="field has-addons">
      <label className="jf-sr-only" htmlFor="q">
        User search query:
      </label>
      <div className="control jf-flexed">
        <input className="input is-medium" name="q" id="q" required />
      </div>
      <div className="control">
        <button className="button is-medium is-primary" type="submit">
          Search
        </button>
      </div>
    </div>
  </form>
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
        <ManualSearchForm />
      </>
    );
  }
  return <AdminUserInfo user={userDetails} showPhoneNumber showName />;
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
        ) : recipient ? (
          <UserInfo {...stringToRecipient(recipient)} />
        ) : (
          <p>No conversation selected.</p>
        )}
      </Page>
    );
  }
);
