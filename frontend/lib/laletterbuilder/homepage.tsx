import React from "react";

import { Trans } from "@lingui/macro";

import Page from "../ui/page";

export const LaLetterBuilderHomepage: React.FC<{}> = () => (
  <Page title="">
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <p>This website is under construction.</p>
          <p>
            <small>
              <Trans>
                This is a test localization message for LaLetterBuilder.
              </Trans>
            </small>
          </p>
        </div>
      </div>
    </section>
  </Page>
);
