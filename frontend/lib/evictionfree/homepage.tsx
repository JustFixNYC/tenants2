import React from "react";
import { Link } from "react-router-dom";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { EvictionFreeRoutes as Routes } from "./route-info";
import { EvictionFreeFaqsPreview } from "./faqs";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { BackgroundImage } from "./components/background-image";
import { OutboundLink } from "../analytics/google-analytics";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";
import classnames from "classnames";
import { LocaleChoice } from "../../../common-data/locale-choices";

export const RTC_WEBSITE_URL = "https://www.righttocounselnyc.org/";
export const HJ4A_SOCIAL_URL = "https://twitter.com/housing4allNY";
export const JUSTFIX_WEBSITE_URLS = {
  en: "https://www.justfix.nyc/en/",
  es: "https://www.justfix.nyc/es/",
};

type EvictionFreeImageType = "png" | "svg" | "jpg";

export function getEFImageSrc(
  name: string,
  type?: EvictionFreeImageType,
  islocalized?: boolean
) {
  const fileName = islocalized ? `${name}_${li18n.language}` : name;
  return `frontend/img/evictionfree/${fileName}.${type || "svg"}`;
}

const FillOutMyFormButton = (props: { isHiddenMobile?: boolean }) => (
  <span className={classnames(props.isHiddenMobile && "is-hidden-mobile")}>
    <Link
      className="button is-primary jf-build-my-declaration-btn jf-is-extra-wide"
      to={Routes.locale.declaration.latestStep}
    >
      <Trans>Fill out my form</Trans>
    </Link>
  </span>
);

const StickyLetterButtonContainer = (props: { children: React.ReactNode }) => (
  <div className="jf-sticky-button-container">
    <div className="jf-sticky-button-menu has-background-white is-hidden-tablet">
      <FillOutMyFormButton />
    </div>
    {props.children}
  </div>
);

const ChecklistItem: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <article className="media">
    <div className="media-left">
      <StaticImage
        ratio="is-32x32"
        src={getEFImageSrc("checkmark")}
        alt="You can"
      />
    </div>
    <div className="media-content">{children}</div>
  </article>
);

const LandingPageChecklist = () => (
  <div className="hero">
    <div className="hero-body">
      <h2 className="title is-spaced has-text-weight-bold">
        <Trans>With this free tool, you can</Trans>
      </h2>
      <br />
      <div className="jf-space-below-2rem">
        <ChecklistItem>
          <Trans>Fill out your hardship declaration form online</Trans>
        </ChecklistItem>
        <ChecklistItem>
          <Trans>
            Automatically fill in your landlord's information based on your
            address if you live in New York City
          </Trans>
        </ChecklistItem>
        <ChecklistItem>
          <Trans>Send your form by email to your landlord and the courts</Trans>
        </ChecklistItem>
        <ChecklistItem>
          <Trans>
            Send your form by USPS Certified Mail for free to your landlord
          </Trans>
        </ChecklistItem>
      </div>
    </div>
  </div>
);

export const EvictionFreeHomePage: React.FC<{}> = () => (
  <Page
    title={li18n._(t`Protect yourself from eviction in New York State`)}
    className="content jf-evictionfree-homepage"
  >
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="columns">
          <div className="column is-three-fifths">
            <h1 className="title is-spaced">
              <Trans>Protect yourself from eviction in New York State</Trans>
            </h1>
            <p className="subtitle">
              <Trans>
                You can use this website to send a hardship declaration form to
                your landlord and local courts— putting your eviction case on
                hold until May 1st, 2021.
              </Trans>
            </p>
            <br />
            <div>
              <FillOutMyFormButton isHiddenMobile />
              <div className="jf-evictionfree-byline">
                <p className="is-size-7">
                  <Trans>
                    Made by non-profits{" "}
                    <OutboundLink href={RTC_WEBSITE_URL}>
                      Right to Counsel NYC Coalition
                    </OutboundLink>
                    ,{" "}
                    <OutboundLink href={HJ4A_SOCIAL_URL}>
                      Housing Justice for All
                    </OutboundLink>
                    , and{" "}
                    <LocalizedOutboundLink hrefs={JUSTFIX_WEBSITE_URLS}>
                      JustFix.nyc
                    </LocalizedOutboundLink>
                  </Trans>
                </p>
              </div>
            </div>
          </div>
          <div className="column">
            <StaticImage
              ratio="is-square"
              src={getEFImageSrc("forms", "png", true)}
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
    <StickyLetterButtonContainer>
      <section className="hero is-info">
        <div className="hero-body">
          <div className="columns is-centered">
            <div className="column is-four-fifths is-size-3 is-size-4-mobile has-text-centered-tablet">
              <Trans id="evictionfree.introToLaw">
                On December 28, 2020, New York State{" "}
                <OutboundLink href="https://legislation.nysenate.gov/pdf/bills/2019/s9114">
                  passed legislation
                </OutboundLink>{" "}
                that protects tenants from eviction due to lost income or
                COVID-19 health risks. In order to get protected, you must fill
                out a{" "}
                <LocalizedOutboundLink
                  hrefs={{
                    en:
                      "https://www.nycourts.gov/courts/nyc/SSI/images/corona/HardshipDeclaration.pdf",
                    es:
                      "https://www.nycourts.gov/courts/nyc/SSI/images/corona/HardshipDeclaration_span.pdf",
                  }}
                >
                  hardship declaration form
                </LocalizedOutboundLink>{" "}
                and send it to your landlord and/or the courts.
              </Trans>
            </div>
          </div>
        </div>
      </section>

      <div className="columns">
        <div className="column is-half">
          <LandingPageChecklist />
        </div>
        <div>
          <BackgroundImage src={getEFImageSrc("phone", "png", true)} alt="" />
        </div>
      </div>

      <div className="columns">
        <div className="is-hidden-mobile">
          <BackgroundImage src={getEFImageSrc("buildings", "jpg")} alt="" />
        </div>
        <div className="column is-half">
          <div className="hero">
            <div className="hero-body">
              <h2 className="title is-spaced has-text-weight-bold">
                <Trans>For New York State tenants</Trans>
              </h2>
              <p>
                <Trans id="evictionfree.whoHasRightToSubmitForm">
                  All tenants in New York State have a right to fill out this
                  hardship declaration form. Especially if you've been served an
                  eviction notice or believe you are at risk of being evicted,
                  please consider using this form to protect yourself.
                </Trans>
              </p>
              <br />
              <p className="has-text-weight-bold">
                <Trans>
                  The protections outlined by NY state law apply to you
                  regardless of immigration status.
                </Trans>
              </p>
            </div>
          </div>
        </div>
        <div className="is-hidden-tablet">
          <BackgroundImage src={getEFImageSrc("buildings", "jpg")} alt="" />
        </div>
      </div>

      <div className="columns">
        <div className="column is-half">
          <div className="hero">
            <div className="hero-body">
              <h2 className="title is-spaced has-text-weight-bold">
                <Trans>For tenants by tenants</Trans>
              </h2>
              <p>
                <Trans id="evictionfree.whoBuildThisTool">
                  Our free tool was built by the{" "}
                  <OutboundLink href={RTC_WEBSITE_URL}>
                    Right to Counsel NYC Coalition
                  </OutboundLink>
                  ,{" "}
                  <OutboundLink href={HJ4A_SOCIAL_URL}>
                    Housing Justice for All
                  </OutboundLink>
                  , and{" "}
                  <LocalizedOutboundLink hrefs={JUSTFIX_WEBSITE_URLS}>
                    JustFix.nyc
                  </LocalizedOutboundLink>{" "}
                  as part of the larger tenant movement across the state.
                </Trans>
              </p>
            </div>
            <br />
          </div>
        </div>
        <div>
          <BackgroundImage src={getEFImageSrc("speaker", "jpg")} alt="" />
        </div>
      </div>

      <section className="hero has-background-white-ter">
        <div className="jf-block-of-color-in-background" />
        <div className="hero-body">
          <div className="columns is-centered">
            <div className="column is-three-quarters has-text-centered-tablet">
              <h2 className="has-text-white	is-spaced has-text-weight-bold">
                <Trans>Fight to #CancelRent</Trans>
              </h2>
              <p className="is-size-3 is-size-4-mobile has-text-white">
                <Trans>
                  After sending your hardship declaration form, connect with
                  local organizing groups to get involved in the fight to make
                  New York eviction free, cancel rent, and more!
                </Trans>
              </p>
              <br />
              <span className="is-hidden-mobile">
                <br />
                <StaticImage
                  ratio="is-3by2"
                  src={getEFImageSrc("protest", "jpg")}
                  alt=""
                />
              </span>
            </div>
            <span className="is-hidden-tablet">
              <BackgroundImage src={getEFImageSrc("protest", "jpg")} alt="" />
            </span>
          </div>
        </div>
      </section>

      <EvictionFreeFaqsPreview />
    </StickyLetterButtonContainer>
  </Page>
);
