import React from 'react';
import { Link } from 'react-router-dom';
import Routes from './routes';

export function WelcomeFragment(): JSX.Element {
  return (
    <React.Fragment>
      <h1 className="title">Welcome!</h1>
      <p>
        We're going to help you create a customized Letter of Complaint that highlights the issues in your apartment that need repair. This will take about 5 minutes.
      </p>
      <ol className="has-text-left">
        <li>Complete an issue checklist.</li>
        <li>Review your Letter of Complaint and send it through JustFix.nyc.</li>
      </ol>
      <Link to={Routes.loc.whyMail} className="button is-primary">Start Letter</Link>
    </React.Fragment>
  );
}

export function WhyMailALetterOfComplaint(props: { heading: 'h1'|'h2' }): JSX.Element {
  const heading = React.createElement(props.heading, null, [
    'Why mail a Certified Letter of Complaint?'
  ]);
  return (
    <React.Fragment>
      {heading}
      <p>
        Under the Warranty of Habitability, your landlord is responsible for keeping your apartment and the building safe and livable at all times.
      </p>
      <p>
        In order to have an official record of the requests you've made to your landlord, you should send to mail a Letter of Complaint to your landlord via Certified Mail. We've drafted this letter for you, and we can also mail this letter on your behalf! All you need to do are enter the issues you are experiencing.
      </p>
    </React.Fragment>
  );
}
