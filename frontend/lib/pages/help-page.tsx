import React, { useContext } from 'react';
import Page from "../ui/page";
import { AppContext } from '../app-context';
import { CustomerSupportLink } from '../ui/customer-support-link';
import { bulmaClasses } from '../ui/bulma';

function EnableSafeModeInfo(props: {}) {
  const { enableSafeModeURL } = useContext(AppContext).server;

  return <form method="POST" action={enableSafeModeURL} className="content">
    <p>
      Having problems using this site? We're sorry for the inconvenience.
      Activate this site's <strong>compatibility mode</strong> for a better
      experience.
    </p>
    <p className="has-text-centered">
      <input type="submit" className={bulmaClasses('button', 'is-primary')} value="Activate compatibility mode" />
    </p>
  </form>;
}

function ContactUsInfo(props: {}) {
  return <div className="content">
    <p>Compatibility mode is now active! Hopefully your problems will go away.</p>
    <p>If you continue to have issues, please email us at <CustomerSupportLink />.</p>
  </div>
}

export default function HelpPage(props: {}) {
  const { isSafeModeEnabled } = useContext(AppContext).session;

  return <Page title="Help" withHeading>
    {isSafeModeEnabled ? <ContactUsInfo /> : <EnableSafeModeInfo />}
  </Page>;
}
