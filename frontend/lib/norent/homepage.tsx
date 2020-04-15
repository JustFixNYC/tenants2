import React from "react";
import Page from "../ui/page";
import { NorentRoutes } from "./routes";
import { CenteredPrimaryButtonLink } from "../ui/buttons";
import { StaticImage } from "../ui/static-image";
import { OutboundLink } from "../analytics/google-analytics";
import { Link } from "react-router-dom";
import { NorentLogo } from "./components/logo";

type NorentImageType = "png" | "svg";

export function getImageSrc(name: string, type?: NorentImageType) {
  return `frontend/img/norent/${name}.${type || "svg"}`;
}

const checklistItems = [
  "Build a letter using our free letter builder",
  "Send your letter by email",
  "Make a special request to your landlord",
  "Send your letter by certified mail for free",
  "Cite up-to-date legal ordinances in your letter",
];

const LandingPageChecklist = () => (
  <div className="jf-space-below">
    {checklistItems.map((checklistItem, i) => (
      <article className="media" key={i}>
        <div className="media-left is-hidden-mobile">
          <StaticImage
            ratio="is-32x32"
            src={getImageSrc("checkmark")}
            alt="Check mark"
          />
        </div>
        <div className="media-content">{checklistItem}</div>
      </article>
    ))}
  </div>
);

const demandsListItems = ["Cancel rent", "Rent strike", "Ban evictions"];

const LandingPageDemands = () => (
  <div className="columns is-variable is-8">
    {demandsListItems.map((demand, i) => (
      <div
        className="column is-one-third has-text-centered jf-has-centered-images"
        key={i}
      >
        <p className="title is-size-5">{demand}</p>
        <br />
        <div className="jf-illustration-fist-pump">
          <StaticImage
            ratio="is-square"
            src={getImageSrc("fistpump")}
            alt="Fist pump"
          />
        </div>
      </div>
    ))}
  </div>
);

const BuildMyLetterButton = () => (
  <CenteredPrimaryButtonLink to={NorentRoutes.locale.letter.latestStep}>
    Build my letter
  </CenteredPrimaryButtonLink>
);

export const NorentHomepage: React.FC<{}> = () => (
  <Page title="NoRent.org" className="content">
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="container jf-has-text-centered-desktop">
          <h1 className="title is-spaced has-text-info">Can't pay rent?</h1>
          <br />
          <p className="subtitle">
            You’re not alone. Millions of Americans won’t be able to pay rent
            because of COVID-19. Use our FREE tool to take action by writing a
            letter to your landlord.
          </p>
          <br />
          <BuildMyLetterButton />
          <br />
        </div>
      </div>
      <div className="container jf-has-centered-images jf-space-below">
        <Link to="#more-info" className="jf-jump-arrow">
          <StaticImage
            ratio="is-32x32"
            src={getImageSrc("downarrow")}
            alt="Explore the tool"
          />
        </Link>
      </div>
    </section>

    <div id="more-info">
      <section className="container">
        <div className="hero is-small">
          <div className="hero-body is-paddingless">
            <div className="jf-illustration-paper-airplanes is-pulled-left">
              <StaticImage
                ratio="is-square"
                src={getImageSrc("paperairplane1")}
                alt="Paper airplane letters"
              />
            </div>
          </div>
        </div>
        <div className="hero is-small">
          <div className="hero-body is-paddingless">
            <div className="container has-text-centered">
              <p className="jf-letter-counter title is-spaced has-text-info">
                5,234
              </p>
              <NorentLogo size="is-96x96" />{" "}
              <span className="subtitle">
                letters sent by Tenants across the USA
              </span>
              <p className="is-uppercase">Since May 2020</p>
            </div>
          </div>
        </div>
        <div className="hero is-small">
          <div className="hero-body is-paddingless">
            <div className="jf-illustration-paper-airplanes is-pulled-right">
              <StaticImage
                ratio="is-square"
                src={getImageSrc("paperairplane2")}
                alt="Paper airplane letters"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="hero has-background-white-ter">
        <div className="hero-body">
          <div className="container jf-tight-container has-text-centered">
            <h3 className="is-spaced has-text-weight-normal">
              Here’s what you can do with <NorentLogo size="is-128x128" />
            </h3>
            <br />
            <LandingPageChecklist />
            <BuildMyLetterButton />
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-body jf-letter-preview-container">
          <div className="container has-text-centered">
            <h3 className="is-spaced has-text-weight-normal">
              Here’s a preview of what the letter looks like:
            </h3>
            <br />
            <article className="message">
              <div className="message-body has-background-grey-lighter has-text-left">
                <p>Dear Landlord/Management.</p>
                <br />
                <p>
                  I am writing to inform you that I have experienced a loss of
                  income, increased expenses and/or other financial
                  circumstances related to the pandemic. Until further notice, I
                  will be unable to pay my rent due to the COVID-19 emergency.
                </p>
                <br />
                <p>
                  Tenants in Florida are protected from eviction for non-payment
                  by Executive Order 20-94, issued by Governor Ron DeSantis on
                  April 2, 2020.
                </p>
                <br />
                <p>
                  Tenants in covered properties are also protected from
                  eviction, fees, penalties, and other charges related to
                  non-payment by the CARES Act (Title IV, Sec. 4024) enacted by
                  Congress on March 27, 2020.
                </p>
                <br />
                <p>
                  Along with my neighbors, I am organizing, encouraging, and/or
                  participating in a tenant organization so that we may support
                </p>
              </div>
              <div className="jf-letter-preview-fadeout" />
            </article>
          </div>
        </div>
      </section>

      <section className="hero has-background-white-ter">
        <div className="hero-body">
          <div className="container jf-tight-container has-text-centered jf-space-below">
            <h2 className="title is-spaced">How it works</h2>
            <p className="subtitle is-size-4">
              We make it easy to weigh your options and notify your landlord by
              email or by certified mail for free.
            </p>
            <br />
          </div>
          <div className="container jf-wide-container">
            <div className="columns is-variable is-8">
              <div className="column is-one-third jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("chatbox")}
                  alt="Chat boxes"
                />
                <p className="title is-size-4 has-text-weight-bold">8 Steps</p>
                <p>
                  Answer a few questions about yourself and your landlord or
                  management company.
                </p>
              </div>
              <div className="column is-one-third jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("connection")}
                  alt="Chat boxes"
                />
                <p className="title is-size-4 has-text-weight-bold">
                  Legal Protections
                </p>
                <p>
                  Our letter cites the most up-to-date legal ordinances that
                  protect tenant rights in your state.
                </p>
              </div>
              <div className="column is-one-third jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("letters")}
                  alt="Chat boxes"
                />
                <p className="title is-size-4 has-text-weight-bold">
                  Free Certified Mail
                </p>
                <p>
                  After you’ve reviewed your letter, we send it to your landlord
                  on your behalf by email and by certified mail.
                </p>
              </div>
            </div>
            <br />
            <BuildMyLetterButton />
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-body">
          <div className="container jf-tight-container has-text-centered jf-space-below">
            <h2 className="title is-spaced">Legally vetted</h2>
            <p className="subtitle is-size-4">
              Our free letter builder was built with{" "}
              <OutboundLink
                href="https://www.justfix.nyc/about/partners"
                rel="noopener noreferrer"
              >
                lawyers and non-profit tenants rights organizations
              </OutboundLink>{" "}
              across the nation to ensure that your letter gives you the most
              protections based on your state.
            </p>
            <br />
          </div>
          <div className="container jf-wide-container">
            <div className="columns is-variable is-8">
              <div className="column is-one-fourth jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("justfix", "png")}
                  alt="Justfix logo"
                />
              </div>
              <div className="column is-one-fourth jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("nwbccc", "png")}
                  alt="NWBCCC logo"
                />
              </div>
              <div className="column is-one-fourth jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("tenantsandneighbors", "png")}
                  alt="Tenants and neighbors logo"
                />
              </div>
              <div className="column is-one-fourth jf-has-centered-images">
                <StaticImage
                  ratio="is-128x128"
                  src={getImageSrc("lsnyc", "png")}
                  alt="Legal Services NYC Logo"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hero has-background-white-ter">
        <div className="hero-body">
          <div className="container jf-tight-container has-text-centered jf-space-below">
            <h2 className="title is-spaced">Locally supported</h2>
            <p className="subtitle is-size-4">
              After sending your letter, we can connect you to local groups to
              organize for greater demands with other tenants.
            </p>
            <br />
          </div>
          <div className="container jf-wide-container">
            <LandingPageDemands />
            <br />
            <BuildMyLetterButton />
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-body">
          <div className="container jf-tight-container has-text-centered jf-space-below">
            <h3 className="is-spaced has-text-weight-normal">
              Sending a letter to your landlord is a big step. Here are a few{" "}
              {/* REPLACE once routes are set up */}
              <Link to={NorentRoutes.locale.home}>
                frequently asked questions
              </Link>{" "}
              from people who have used our tool:
            </h3>
            <br />
            <BuildMyLetterButton />
          </div>
        </div>
      </section>
    </div>
  </Page>
);
