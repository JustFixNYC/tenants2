import React from 'react';

import { withAppContext, AppContextType } from '../app-context';
import { LetterRequestMailChoice } from '../queries/globalTypes';
import { AllSessionInfo_letterRequest } from '../queries/AllSessionInfo';
import Page from '../page';

function LetterStatus(props: { letterRequest: AllSessionInfo_letterRequest }): JSX.Element {
  const { mailChoice, updatedAt } = props.letterRequest;

  if (mailChoice === LetterRequestMailChoice.WE_WILL_MAIL) {
    return (
      <React.Fragment>
        <p>We've received your request to mail a letter of complaint on {updatedAt}.</p>
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
      <div className="content">
        {letterRequest && <LetterStatus letterRequest={letterRequest} />}
        <p className="has-text-centered">
          <a href={props.server.locPdfURL} target="_blank" className="button is-text">Download your letter of complaint (PDF)</a>
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
