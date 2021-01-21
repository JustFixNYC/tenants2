import React from "react";
import { Link } from "react-router-dom";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { EvictionFreeRoutes as Routes } from "./route-info";
import { EvictionFreeFaqsPreview } from "./faqs";

type EvictionFreeImageType = "png" | "svg";

export function getEFImageSrc(name: string, type?: EvictionFreeImageType) {
  return `frontend/img/evictionfree/${name}.${type || "svg"}`;
}

const checklistItems = () => [
  `Build a letter using our free letter builder`,
  `Send your letter by email`,
  `Send your letter by certified mail for free`,
  `Cite up-to-date legal ordinances in your letter`,
];

const LandingPageChecklist = () => (
  <div className="hero">
    <div className="hero-body">
      <h2 className="is-size-3 is-spaced has-text-weight-bold">
        With our free tool, you can
      </h2>
      <br />
      <div className="jf-space-below-2rem">
        {checklistItems().map((checklistItem, i) => (
          <article className="media" key={i}>
            <div className="media-left">
              <StaticImage
                ratio="is-32x32"
                src={getEFImageSrc("checkmark")}
                alt="You can"
              />
            </div>
            <div className="media-content">{checklistItem}</div>
          </article>
        ))}
      </div>
    </div>
  </div>
);

export const EvictionFreeHomePage: React.FC<{}> = () => (
  <Page
    title="Protect yourself from eviction in New York State"
    className="content"
  >
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="columns">
          <div className="column is-three-fifths">
            <h1 className="title is-spaced">
              Protect yourself from eviction in New York State
            </h1>
            <p className="subtitle">
              Use our free tool to send a hardship declaration form to your
              landlord and your local courts to put your eviction case on hold
              until May 1st, 2021.
            </p>
            <br />
            <Link
              className="button is-primary jf-build-my-declaration-btn"
              to={Routes.locale.declaration.latestStep}
            >
              Build my declaration
            </Link>
          </div>
          <div className="column">
            <StaticImage
              ratio="is-square"
              src={getEFImageSrc("forms", "png")}
              alt=""
            />
          </div>
        </div>
      </div>
    </section>

    <section className="hero is-info">
      <div className="hero-body">
        <div className="columns is-centered">
          <div className="column is-three-quarters is-size-4 has-text-centered">
            On December 28, 2020, New York State signed into law an eviction
            moratorium that protects tenants from eviction provided that they
            fill out a hardship declaration form and send it to their landlord
            and/or the courts.
          </div>
        </div>
      </div>
    </section>

    <div className="columns">
      <div className="column is-half">
        <LandingPageChecklist />
      </div>
      <div className="column is-half"></div>
    </div>

    <div className="columns">
      <div className="column is-half"></div>
      <div className="column is-half">
        <div className="hero">
          <div className="hero-body">
            <h2 className="is-size-3 is-spaced has-text-weight-bold">
              For New York state tenants
            </h2>
            <p>This tool is for you if:</p>
            <ul>
              <li>
                you are a New York State tenant who has been impacted by
                COVID-19
              </li>
            </ul>
            <p>And:</p>
            <ul>
              <li>
                you have been served an eviction notice by your landlord in the
                last X months and/or
              </li>
              <li>believe you are at risk of being evicted </li>
            </ul>
            <p className="has-text-weight-bold">
              The protections outlined by NY state law apply to you regardless
              of immigration status.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="columns">
      <div className="column is-half">
        <div className="hero">
          <div className="hero-body">
            <h2 className="is-size-3 is-spaced has-text-weight-bold">
              For tenants by tenants
            </h2>
            <p>
              Our free tool was built by Right to Counsel, Housing Justice for
              All, and JustFix.nyc as part of the larger tenant movement across
              the state.
            </p>
          </div>
        </div>
      </div>
      <div className="column is-half"></div>
    </div>

    <section className="hero is-info">
      <div className="hero-body">
        <div className="columns is-centered">
          <div className="column is-three-quarters is-size-4 has-text-centered">
            <h2 className="is-size-3 has-text-white	is-spaced has-text-weight-bold">
              Fight to #CancelRent
            </h2>
            <p>
              After sending your declaration, connect with local groups to
              organize for greater demands with other tenants including
              cancelling rent.
            </p>
          </div>
        </div>
      </div>
    </section>

    <EvictionFreeFaqsPreview />
  </Page>
);
