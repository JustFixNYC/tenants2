import React from "react";
import Page from "../ui/page";
import { NorentRoutes } from "./routes";
import { CenteredPrimaryButtonLink } from "../ui/buttons";
import { StaticImage } from "../ui/static-image";
import { OutboundLink } from "../analytics/google-analytics";
import { NorentLogo } from "./components/logo";
import { NorentFaqsPreview } from "./faqs";
import { PartnerLogos } from "./about";
import classnames from "classnames";
import { ScrollyLink } from "../ui/scrolly-link";
import { Link } from "react-router-dom";
import { LetterCounter } from "./components/letter-counter";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

type NorentImageType = "png" | "svg";

export function getImageSrc(name: string, type?: NorentImageType) {
  return `frontend/img/norent/${name}.${type || "svg"}`;
}

export const JumpArrow = (props: { to: string; altText: string }) => (
  <ScrollyLink to={props.to} className="jf-jump-arrow">
    <span className="is-hidden-mobile">
      <StaticImage
        ratio="is-32x32"
        src={getImageSrc("downarrow")}
        alt={props.altText}
      />
    </span>
    <span className="is-hidden-tablet">
      <StaticImage
        ratio="is-24x24"
        src={getImageSrc("downarrow-mobile")}
        alt={props.altText}
      />
    </span>
  </ScrollyLink>
);

export const BuildMyLetterButton = (props: { isHiddenMobile?: boolean }) => (
  <span className={classnames(props.isHiddenMobile && "is-hidden-mobile")}>
    <CenteredPrimaryButtonLink to={NorentRoutes.locale.letter.latestStep}>
      <Trans>Build my letter</Trans>
    </CenteredPrimaryButtonLink>
  </span>
);

export const StickyLetterButtonContainer = (props: {
  containerId: string;
  children: React.ReactNode;
}) => (
  <div id={props.containerId} className="jf-sticky-button-container">
    <div className="jf-sticky-button-menu has-background-white is-hidden-tablet">
      <BuildMyLetterButton />
    </div>
    {props.children}
  </div>
);

const checklistItems = () => [
  li18n._(t`Build a letter using our free letter builder`),
  li18n._(t`Send your letter by email`),
  li18n._(t`Send your letter by certified mail for free`),
  li18n._(t`Cite up-to-date legal ordinances in your letter`),
];

type ChecklistBackgroundColor = "off-white" | "white";

export const LandingPageChecklist = (props: {
  backgroundColor?: ChecklistBackgroundColor;
}) => (
  <section
    className={classnames(
      "hero",
      "jf-norent-checklist",
      props.backgroundColor === "off-white" && "has-background-white-ter"
    )}
  >
    <div className="hero-body">
      <div className="container jf-has-text-centered-tablet">
        <h3 className="is-size-5 is-spaced has-text-weight-normal">
          <Trans>
            Here’s what you can do with <NorentLogo size="is-128x128" />
          </Trans>
        </h3>
      </div>
      <div className="container jf-tight-container">
        <br />
        <div className="jf-space-below-2rem">
          {checklistItems().map((checklistItem, i) => (
            <article className="media" key={i}>
              <div className="media-left">
                <StaticImage
                  ratio="is-32x32"
                  src={getImageSrc("checkmark")}
                  alt={li18n._(t`You can`)}
                />
              </div>
              <div className="media-content">{checklistItem}</div>
            </article>
          ))}
        </div>
        <BuildMyLetterButton isHiddenMobile />
      </div>
    </div>
  </section>
);

const demandsListItems = () => [
  li18n._(t`Going on rent strike`),
  li18n._(t`Cancelling rent`),
  li18n._(t`Banning evictions`),
];

const LandingPageCollectiveActionList = () => (
  <div className="container jf-collective-action-list jf-space-below-2rem">
    {demandsListItems().map((demand, i) => (
      <article className="media" key={i}>
        <div className="media-left">
          <StaticImage ratio="is-64x64" src={getImageSrc("fistpump")} alt="" />
        </div>
        <div className="media-content title jf-alt-title-font is-size-5">
          {demand}
        </div>
      </article>
    ))}
  </div>
);

export const NorentHomePage: React.FC<{}> = () => {
  return (
    <Page title="" className="content">
      <section className="hero is-fullheight-with-navbar">
        <div className="hero-body">
          <div className="container jf-has-text-centered-tablet">
            <h1 className="title is-spaced has-text-info">
              <Trans>Can't pay rent?</Trans>
            </h1>
            <br />
            <p className="subtitle">
              <Trans>
                You’re not alone. Millions of Americans won’t be able to pay
                rent because of COVID&#8209;19. Use our FREE tool to take action
                by writing a letter to your landlord.
              </Trans>
            </p>
            <br />
            <BuildMyLetterButton isHiddenMobile />
            <br />
            <p className="is-size-6">
              <Trans>
                A national tool by non-profit{" "}
                <OutboundLink
                  href="https://www.justfix.nyc/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JustFix.nyc
                </OutboundLink>
              </Trans>
            </p>
            <br />
          </div>
        </div>
        <div className="container jf-has-centered-images jf-space-below-2rem">
          <JumpArrow to="#more-info" altText={li18n._(t`Explore the tool`)} />
        </div>
      </section>

      <StickyLetterButtonContainer containerId="more-info">
        <LandingPageChecklist />

        <section className="hero has-background-white-ter jf-space-below-2rem">
          <div className="hero-body">
            <div className="container jf-tight-container jf-has-text-centered-tablet jf-space-below-2rem">
              <h2 className="title is-spaced">
                <Trans>Legally vetted</Trans>
              </h2>
              <p className="subtitle is-size-5">
                <Trans id="norent.explanationOfPartnerships">
                  Our free letter builder was built with{" "}
                  <Link to={NorentRoutes.locale.about}>
                    lawyers and non-profit tenants rights organizations
                  </Link>{" "}
                  across the nation to ensure that your letter gives you the
                  most protections based on your state.
                </Trans>
              </p>
              <br />
            </div>
            <div className="container jf-tight-container">
              <PartnerLogos />
            </div>
          </div>
        </section>

        <section className="container">
          <div className="hero is-small">
            <div className="hero-body is-paddingless">
              <div className="jf-illustration-paper-airplanes is-pulled-left">
                <StaticImage
                  ratio="is-square"
                  src={getImageSrc("paperairplane1")}
                  alt=""
                />
              </div>
            </div>
          </div>
          <LetterCounter />
          <div className="hero is-small">
            <div className="hero-body is-paddingless">
              <div className="jf-illustration-paper-airplanes is-pulled-right">
                <StaticImage
                  ratio="is-square"
                  src={getImageSrc("paperairplane2")}
                  alt=""
                />
              </div>
            </div>
          </div>
        </section>

        <section className="hero has-background-white-ter">
          <div className="hero-body">
            <div className="container jf-tight-container jf-has-text-centered-tablet jf-space-below-2rem">
              <h2 className="title is-spaced">
                <Trans>How it works</Trans>
              </h2>
              <p className="subtitle is-size-5">
                <Trans>
                  We make it easy to notify your landlord by email or by
                  certified mail for free.
                </Trans>
              </p>
              <br />
            </div>
            <div className="container jf-wide-container jf-how-it-works-container">
              <div className="columns is-variable is-8-desktop">
                <div className="column is-one-third jf-has-centered-images">
                  <div>
                    <StaticImage
                      ratio="is-128x128"
                      src={getImageSrc("stopwatch")}
                      alt=""
                    />
                  </div>
                  <div>
                    <p className="title is-size-4 jf-alt-title-font">
                      <Trans>8 Minutes</Trans>
                    </p>
                    <p>
                      <Trans>
                        Answer a few questions about yourself and your landlord
                        or management company. It'll take no more than 8
                        minutes.
                      </Trans>
                    </p>
                  </div>{" "}
                </div>
                <div className="column is-one-third jf-has-centered-images">
                  <div>
                    <StaticImage
                      ratio="is-128x128"
                      src={getImageSrc("legal")}
                      alt=""
                    />
                  </div>
                  <div>
                    <p className="title is-size-4 jf-alt-title-font">
                      <Trans>Legal Protections</Trans>
                    </p>
                    <p>
                      <Trans>
                        Our letter cites the most up-to-date legal ordinances
                        that protect tenant rights in your state.
                      </Trans>
                    </p>
                  </div>
                </div>
                <div className="column is-one-third jf-has-centered-images">
                  <div>
                    <StaticImage
                      ratio="is-128x128"
                      src={getImageSrc("letters")}
                      alt=""
                    />
                  </div>
                  <div>
                    <p className="title is-size-4 jf-alt-title-font">
                      <Trans>Free Certified Mail</Trans>
                    </p>
                    <p>
                      <Trans>
                        After you’ve reviewed your letter, we send it to your
                        landlord on your behalf by email and by certified mail.
                      </Trans>
                    </p>
                  </div>
                </div>
              </div>
              <br className="is-hidden-mobile" />
              <BuildMyLetterButton isHiddenMobile />
            </div>
          </div>
        </section>

        <section className="hero">
          <div className="hero-body jf-letter-preview-container">
            <div className="container jf-has-text-centered-tablet">
              <h3 className="is-size-5 is-spaced has-text-weight-normal">
                <Trans>Here’s a preview of what the letter looks like:</Trans>
              </h3>
              <br />
              {/* NOTE: 
              The content for this letter preview intentionally does not make use of our <LetterPreview> component. 
              Here, the designer wanted a descriptive element getting across the concept, 
              rather than a detailed example of what an actual letter looks like. */}
              <article className="message">
                <div className="message-body has-background-grey-lighter has-text-left has-text-weight-light">
                  <p>
                    <Trans>Dear Landlord/Management.</Trans>
                  </p>
                  <br />
                  <Trans id="norent.sampleNoRentLetter">
                    <p>
                      I am writing to inform you that I have experienced a loss
                      of income, increased expenses and/or other financial
                      circumstances related to the pandemic. Until further
                      notice, the COVID-19 emergency may impact my ability to
                      pay rent.
                    </p>
                    <br />
                    <p>
                      Tenants in Florida are protected from eviction for
                      non-payment by Executive Order 20-94, issued by Governor
                      Ron DeSantis on April 2, 2020.
                    </p>
                    <br />
                    <p className="is-hidden-mobile">
                      Tenants in covered properties are also protected from
                      eviction, fees, penalties, and other charges related to
                      non-payment by the CARES Act (Title IV, Sec. 4024) enacted
                      by Congress on March 27, 2020.
                    </p>
                    <br />
                    <p className="is-hidden-mobile">
                      Along with my neighbors, I am organizing, encouraging,
                      and/or participating in a tenant organization so that we
                      may support
                    </p>
                  </Trans>
                </div>
                <div className="jf-letter-preview-fadeout" />
              </article>
            </div>
          </div>
        </section>

        <section className="hero has-background-white-ter">
          <div className="hero-body">
            <div className="container jf-tight-container jf-has-text-centered-tablet jf-space-below-2rem">
              <h2 className="title is-spaced">
                <Trans>Locally supported</Trans>
              </h2>
              <p className="subtitle is-size-5">
                <Trans>
                  After sending your letter, we can connect you to{" "}
                  <Link to={NorentRoutes.locale.about}>local groups</Link> to
                  organize for greater demands with other tenants.
                </Trans>
              </p>
              <br />
              <p className="subtitle is-size-5">
                <Trans>Collective action is a powerful tool for:</Trans>
              </p>
            </div>
            <LandingPageCollectiveActionList />
            <br />
            <BuildMyLetterButton isHiddenMobile />
          </div>
        </section>

        <NorentFaqsPreview />
      </StickyLetterButtonContainer>
    </Page>
  );
};
