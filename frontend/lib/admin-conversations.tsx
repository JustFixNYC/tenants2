import React, { useEffect, useContext, useState, useMemo } from 'react';
import { Switch, Route, RouteComponentProps, Link } from "react-router-dom";
import Routes from "./routes";
import { AppContext } from './app-context';
import { AdminConversations, AdminConversationsVariables } from './queries/AdminConversations';
import { QueryLoaderQuery } from './query-loader-prefetcher';
import { AdminConversationVariables, AdminConversation } from './queries/AdminConversation';
import { getQuerystringVar } from './querystring';
import { Helmet } from 'react-helmet-async';
import { whoOwnsWhatURL } from './wow-link';

const PHONE_QS_VAR = 'phone';

function useQuery<Input, Output>(query: QueryLoaderQuery<Input, Output>, input: Input|null): Output|null {
  const [value, setValue] = useState<Output|null>(null);
  const appCtx = useContext(AppContext);
  const { fetch } = appCtx;

  useEffect(() => {
    let isMounted = true;
    if (input !== null) {
      const result = query.fetch(fetch, input);
      result.then(v => isMounted && setValue(v));
    }
    return () => { isMounted = false; };
  }, [fetch, input]);

  return value;
}

function makeConversationURL(phoneNumber: string): string {
  return Routes.adminConversations + `?${PHONE_QS_VAR}=${encodeURIComponent(phoneNumber)}`;
}

function friendlyPhoneNumber(phoneNumber: string): string {
  const match = phoneNumber.match(/^\+1(\d\d\d)(\d\d\d)(\d\d\d\d)$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
}

const AdminConversationsPage: React.FC<RouteComponentProps> = (props) => {
  const selectedPhoneNumber = getQuerystringVar(props.location.search, PHONE_QS_VAR);
  const conversationsInput = useMemo<AdminConversationsVariables>(() => ({
    query: '',
    page: 1,
  }), []);
  const conversations = useQuery(AdminConversations, conversationsInput);
  const conversationInput = useMemo<AdminConversationVariables|null>(() => selectedPhoneNumber ? {
    phoneNumber: selectedPhoneNumber,
    page: 1,
  } : null, [selectedPhoneNumber]);
  const conversation = useQuery(AdminConversation, conversationInput);
  const convMsgs = conversation?.output || [];
  const user = conversation?.userDetails;
  const userFullName = [user?.firstName || '', user?.lastName || ''].join(' ').trim();

  return <div className="jf-admin-conversations-wrapper">
    <Helmet>
      <html className="jf-is-fullscreen-admin-page"/>
    </Helmet>
    <div className="jf-conversation-sidebar">
      {conversations?.output?.map(conv => {
        return <Link key={conv.userPhoneNumber}
                     className={conv.userPhoneNumber === selectedPhoneNumber ? 'jf-selected' : ''}
                     to={makeConversationURL(conv.userPhoneNumber)}>
          <div className="jf-tenant">{conv.userFullName || friendlyPhoneNumber(conv.userPhoneNumber)}</div>
          <div className="jf-body">{conv.body}</div>
        </Link>
      }) || <p>Loading...</p>}
    </div>
    <div className="jf-current-conversation">
      {selectedPhoneNumber && <>
        <div className="jf-user-details content">
          <h1>Conversation with {userFullName || friendlyPhoneNumber(selectedPhoneNumber)}</h1>
          {user ? <>
            {userFullName && <p>This user's phone number is {friendlyPhoneNumber(selectedPhoneNumber)}.</p>}
            {user.onboardingInfo && <p>The user's signup intent is {user.onboardingInfo.signupIntent}.</p>}
            {user.letterRequest && <p>The user completed a letter of complaint on {user.letterRequest.updatedAt}.</p>}
            <a href={user.adminUrl} className="button is-small" target="_blank">Edit user</a>
            {user.onboardingInfo?.padBbl &&
              <a href={whoOwnsWhatURL(user.onboardingInfo.padBbl)} className="button is-small" target="_blank" rel="noopener noreferrer">View user's building in WoW</a>}
          </> : <p>This phone number does not seem to have an account with us.</p>}
        </div>
        <div className="jf-messages">
          {convMsgs.length ? convMsgs.map(msg => {
            return <div key={msg.sid} className={msg.isFromUs ? 'jf-from-us' : 'jf-to-us'}>
              <div title={`This message was sent on ${msg.dateSent}.`}>
                {msg.body}
              </div>
            </div>
          }) : <p>We have no record of any SMS messages exchanged with this phone number.</p>}
        </div>
      </>}
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
