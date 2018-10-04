import React from 'react';

export function WhyMailALetterOfComplaint(props: { heading: 'h1'|'h2'|'h3' }): JSX.Element {
  const heading = React.createElement(props.heading, null, [
    'What are the benefits of Mailing a Certified Letter?'
  ]);
  return (
    <React.Fragment>
      {heading}
      <p>
        Your landlord is responsible for keeping your apartment and the building safe and livable at all times. This is called the <strong>Warranty of Habitability</strong>.
      </p>
      <p>
        If your landlord has been unresponsive to requests to make repairs, a letter is a great tactic! By mailing a Letter of Complaint via Certified mail, you will have an official record of the requests you’ve made to your landlord. Plus, we’ll even send it Certified Mail on your behalf!
      </p>
    </React.Fragment>
  );
}
