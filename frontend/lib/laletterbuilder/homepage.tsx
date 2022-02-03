import React from "react";

import { Trans } from "@lingui/macro";

import Page from "../ui/page";
import { Link } from "react-router-dom";

import { LaLetterBuilderRouteInfo as Routes } from "./route-info";

export const LaLetterBuilderHomepage: React.FC<{}> = () => (
  <Page title="" className="content">
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h1 className="title is-spaced has-text-info">
            <Trans>Landing page</Trans>
          </h1>
          <br />
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
              to={Routes.locale.chooseLetter}
            >
              See which letter is right for me
            </Link>
          </p>
        </div>
      </div>
    </section>
  </Page>
);
