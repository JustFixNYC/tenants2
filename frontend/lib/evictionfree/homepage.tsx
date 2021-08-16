import React from "react";
import { useLocation } from "react-router-dom";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import {
  EnglishOutboundLink,
  LocalizedOutboundLink,
} from "../ui/localized-outbound-link";

export const MESSAGE_QS = "msg=on";
export const RTC_WEBSITE_URL = "https://www.righttocounselnyc.org/";
export const HJ4A_SOCIAL_URL = "https://twitter.com/housing4allNY";
export const JUSTFIX_WEBSITE_URLS = {
  en: "https://www.justfix.nyc/en/",
  es: "https://www.justfix.nyc/es/",
};
export const HARDSHIP_DECLARATION_FORM_URLS = {
  en:
    "http://www.nycourts.gov/eefpa/PDF/Eviction_Hardship_Declaration-English.pdf",
  es:
    "http://www.nycourts.gov/eefpa/PDF/Eviction_Hardship_Declaration-Spanish.pdf",
};

type EvictionFreeImageType = "png" | "svg" | "jpg" | "gif";

export function getEFImageSrc(
  name: string,
  type?: EvictionFreeImageType,
  islocalized?: boolean
) {
  const fileName = islocalized ? `${name}_${li18n.language}` : name;
  return `frontend/img/evictionfree/${fileName}.${type || "svg"}`;
}

const Message: React.FC<{}> = () => {
  const location = useLocation();

  if (location.search.includes(MESSAGE_QS)) {
    return (
      <div className="notification is-danger">
        <Trans>This tool has been suspended</Trans>!
      </div>
    );
  }
  return null;
};

export const EvictionFreeHomePage: React.FC<{}> = () => (
  <Page
    title={li18n._(t`Protect yourself from eviction in New York State`)}
    className="content jf-evictionfree-homepage"
  >
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="columns">
          <div className="column is-three-fifths">
            <Message />
            <h1 className="title is-spaced">
              <Trans>Eviction Free NY has been suspended</Trans>
            </h1>
            <p className="subtitle">
              <Trans id="evictionfree.noticeOfSuddenMoratoriumSuspension">
                The State law that delays evictions for tenants who submit
                hardship declarations has been suspended. Learn about your
                rights, and take action today to protect and expand them
              </Trans>
              .
            </p>
            <br />
            <div>
              <LocalizedOutboundLink
                hrefs={{
                  en:
                    "https://www.righttocounselnyc.org/eviction_protections_during_covid",
                  es:
                    "https://www.righttocounselnyc.org/protecciones_contra_desalojos",
                }}
              >
                <div className="button is-primary jf-build-my-declaration-btn jf-is-extra-wide">
                  <Trans>Learn more</Trans>
                </div>
              </LocalizedOutboundLink>
              <EnglishOutboundLink href="https://www.righttocounselnyc.org/take_action_rtc">
                <div className="button is-primary jf-build-my-declaration-btn jf-is-extra-wide">
                  <Trans>Take action</Trans>
                </div>
              </EnglishOutboundLink>
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
  </Page>
);
