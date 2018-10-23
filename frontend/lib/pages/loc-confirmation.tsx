import React from 'react';
import Loadable from 'react-loadable';

import { withAppContext, AppContextType } from '../app-context';
import { LetterRequestMailChoice } from '../queries/globalTypes';
import { AllSessionInfo_letterRequest } from '../queries/AllSessionInfo';
import Page from '../page';
import { friendlyDate } from '../util';
import { OutboundLink } from '../google-analytics';
import { SimpleProgressiveEnhancement } from '../progressive-enhancement';

const LoadableConfetti = Loadable({
  loader: () => import(/* webpackChunkName: "confetti" */ '../confetti'),
  // We don't want to display anything while the confetti is loading.
  loading() { return null; },
  // This ensures that our server doesn't generate <script> tags
  // to load this component in its static HTML: we don't *want* to block page
  // load on this optional feature.
  modules: [],
  webpack: () => [],
});

function LetterStatus(props: { letterRequest: AllSessionInfo_letterRequest }): JSX.Element {
  const { mailChoice, updatedAt } = props.letterRequest;

  if (mailChoice === LetterRequestMailChoice.WE_WILL_MAIL) {
    const dateStr = friendlyDate(new Date(updatedAt));
    return (
      <React.Fragment>
        <p>We've received your request to mail a letter of complaint on {dateStr}.</p>
        <p>We'll send you your certified mail tracking number once we have it!</p>
      </React.Fragment>
    );
  }
  return (
    <p>Now you just need to print it out and mail it.</p>
  );
}

const LetterConfirmation = withAppContext((props: AppContextType): JSX.Element => {
  const { letterRequest } = props.session;
  return (
    <Page title="Your letter of complaint has been created!">
      <h1 className="title">Your letter of complaint has been created!</h1>
      <SimpleProgressiveEnhancement>
        <LoadableConfetti regenerateForSecs={1} />
      </SimpleProgressiveEnhancement>
      <div className="content">
        {letterRequest && <LetterStatus letterRequest={letterRequest} />}
        <p className="has-text-centered">
          <OutboundLink href={props.server.locPdfURL} target="_blank" className="button is-text">Download letter (PDF)</OutboundLink>
        </p>
        <h2>What happens next?</h2>
        <p>
          Your landlord should contact you once they receive the letter to schedule time to make repairs for the access dates you provided.
        </p>
        <p>
          If you don't hear from them, report these issues to 311.
        </p>
      </div>
    </Page>
  );
});

export default LetterConfirmation;
