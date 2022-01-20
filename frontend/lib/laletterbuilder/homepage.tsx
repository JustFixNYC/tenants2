import React from "react";

import { Trans } from "@lingui/macro";

import Page from "../ui/page";
import { Link } from "react-router-dom";

import { LaLetterBuilderRouteInfo as Routes } from "./route-info";

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
          <p>
            <Link
              className="button is-light is-medium"
              to={Routes.locale.letter.latestStep}
            >
              Build my letter
            </Link>
          </p>
        </div>
      </div>
    </section>
  </Page>
);
