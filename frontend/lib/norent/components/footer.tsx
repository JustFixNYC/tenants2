import React from "react";
import { LanguageToggle } from "./language-toggle";
import { NorentRoutes as Routes } from "../routes";
import { Link } from "react-router-dom";
import { NorentLogo } from "./logo";
import { StaticImage } from "../../ui/static-image";
import { getImageSrc } from "../homepage";
import { PrivacyPolicyLink, TermsOfUseLink } from "../../ui/privacy-info-modal";
import { SocialIcons } from "./social-icons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";

const MAILCHIMP_URL =
  "https://nyc.us13.list-manage.com/subscribe?u=d4f5d1addd4357eb77c3f8a99&id=588f6c6ef4";

const EmailSignupForm = () => (
  <form
    action={MAILCHIMP_URL}
    className="email-form is-horizontal-center"
    method="post"
    target="_blank"
  >
    <div className="mc-field-group">
      <div className="control is-expanded">
        <label htmlFor="mce-EMAIL" className="jf-sr-only">
          <Trans>Email</Trans>
        </label>
        <input
          type="email"
          name="EMAIL"
          className="required email input"
          id="mce-EMAIL"
          placeholder={li18n._(t`ENTER YOUR EMAIL`)}
        />
      </div>
      <div className="control has-text-centered-touch">
        <button
          className="button"
          type="submit"
          aria-label={li18n._(t`Submit email`)}
        >
          <StaticImage
            ratio="is-16x16"
            src={getImageSrc("submitarrow")}
            alt={li18n._(t`Submit email`)}
          />
        </button>
      </div>
    </div>
  </form>
);

export const NorentFooter: React.FC<{}> = () => (
  <footer>
    <div className="container has-background-dark">
      <div className="columns">
        <div className="column is-8">
          <h6 className="title is-size-3 has-text-weight-bold has-text-white">
            <Trans>
              Join our <br className="is-hidden-tablet" />
              mailing list
            </Trans>
          </h6>
          <EmailSignupForm />
          <SocialIcons color="white" />
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
            <LanguageToggle />
            <Trans id="norent.legalDisclaimer">
              <p>
                Disclaimer: The information in JustFix.nyc does not constitute
                legal advice and must not be used as a substitute for the advice
                of a lawyer qualified to give advice on legal issues pertaining
                to housing. We can help direct you to free legal services if
                necessary.
              </p>
            </Trans>
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
