import React from "react";

import { Trans } from "@lingui/macro";

import Page from "../ui/page";
import { Link } from "react-router-dom";

import { LaLetterBuilderRouteInfo as Routes } from "./route-info";
import { CenteredPrimaryButtonLink } from "../ui/buttons";

type LaLetterBuilderImageType = "png" | "svg";

export function getLaLetterBuilderImageSrc(
  name: string,
  type?: LaLetterBuilderImageType
) {
  return `frontend/img/laletterbuilder/${name}.${type || "svg"}`;
}

export const LaLetterBuilderHomepage: React.FC<{}> = () => (
  <Page title="" className="content">
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h1 className="title is-spaced has-text-info">
            <Trans>As an LA resident, you have a right to safe housing.</Trans>
          </h1>
          <br />
          <p className="subtitle">
            <Trans>
              Exercise your tenant rights. Send a free letter of complaint to
              your landlord in minutes.
            </Trans>
          </p>
          <br />
          <p>
            <CenteredPrimaryButtonLink to={Routes.locale.chooseLetter}>
              <Trans>See which letter is right for me</Trans>
            </CenteredPrimaryButtonLink>
          </p>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-secondary">
      EXAMPLE NEXT SECTION
    </section>
  </Page>
);
