import React from "react";
import { FooterLanguageToggle } from "../../ui/language-toggle";
import { NorentRoutes as Routes } from "../routes";
import { Link } from "react-router-dom";
import { NorentLogo } from "./logo";
import { PrivacyPolicyLink, TermsOfUseLink } from "../../ui/privacy-info-modal";
import { SocialIcons } from "./social-icons";
import { Trans } from "@lingui/macro";
import Subscribe from "./subscribe";
import { SimpleProgressiveEnhancement } from "../../ui/progressive-enhancement";
import { LegalDisclaimer } from "../../ui/legal-disclaimer";

export const NorentFooter: React.FC<{}> = () => (
  <footer>
    <div className="container has-background-dark">
      <div className="columns">
        <div className="column is-8">
          <SimpleProgressiveEnhancement>
            <>
              <h6 className="title is-size-3 has-text-weight-bold has-text-white">
                <Trans>
                  Join our <br className="is-hidden-tablet" />
                  mailing list
                </Trans>
              </h6>
              <Subscribe />
              <SocialIcons color="white" />
            </>
          </SimpleProgressiveEnhancement>
        </div>
        <div className="column is-4 has-text-right is-uppercase content">
          <Link to={Routes.locale.letter.latestStep}>
            <Trans>Build my Letter</Trans>
          </Link>
          <Link to={Routes.locale.aboutLetter}>
            <Trans>The Letter</Trans>
          </Link>
          <Link to={Routes.locale.faqs}>
            <Trans>Faqs</Trans>
          </Link>
          <Link to={Routes.locale.about}>
            <Trans>About</Trans>
          </Link>
          <PrivacyPolicyLink />
          <TermsOfUseLink />
        </div>
      </div>
      <div className="columns">
        <div className="column is-8">
          <div className="content is-size-7">
            <FooterLanguageToggle />
            <LegalDisclaimer website="NoRent.org" />
            <Trans>
              <NorentLogo size="is-64x64" color="white">
                NoRent
              </NorentLogo>{" "}
              <span>brought to you by JustFix.nyc</span>
            </Trans>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
