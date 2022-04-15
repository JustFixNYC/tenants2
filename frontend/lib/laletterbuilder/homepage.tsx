import React from "react";

import { Trans } from "@lingui/macro";

import Page from "../ui/page";

import { LaLetterBuilderRouteInfo as Routes } from "./route-info";
import { CenteredPrimaryButtonLink } from "../ui/buttons";
import { StaticImage } from "../ui/static-image";

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
          <CenteredPrimaryButtonLink to={Routes.locale.chooseLetter}>
            <Trans>See which letter is right for me</Trans>
          </CenteredPrimaryButtonLink>
        </div>
      </div>
    </section>
    <section className="jf-laletterbuilder-landing-section-secondary">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="is-spaced has-text-info">
            <Trans>Legally vetted</Trans>
          </h2>
          <br />
          <p className="subtitle">
            <Trans>
              We built the LA Letter Builder with lawyers and non-profit tenants
              rights organizations in Los Angeles to ensure that your letter
              gives you the most protections.
            </Trans>
          </p>
          <br />
          <div className="is-spaced has-text-info">
            <Trans>Created by</Trans>
            <StaticImage
              ratio="is-3by1"
              src={getLaLetterBuilderImageSrc(
                "justfix-saje-combined-logo-black"
              )}
              alt="JustFix SAJE"
            />
          </div>
        </div>
      </div>
    </section>
  </Page>
);
