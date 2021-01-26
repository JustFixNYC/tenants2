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
  <span>
    Fill out your hardship declaration form online.
    <br />
    <span className="is-italic">If you live in New York City,</span> the tool
    will automatically fill in your landlord's information based on your address
  </span>,
  <span>Send your form by email to your landlord and the courts</span>,
  <span>Send your form by USPS Certified Mail for free to your landlord</span>,
];

const LandingPageChecklist = () => (
  <div className="hero">
    <div className="hero-body">
      <h2 className="is-size-3 is-spaced has-text-weight-bold">
        With this free tool, you can
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
              You can use this website to send a hardship declaration form to
              your landlord and local courts— putting your eviction case on hold
              until May 1st, 2021.
            </p>
            <br />
            <Link
              className="button is-primary jf-build-my-declaration-btn jf-is-extra-wide"
              to={Routes.locale.declaration.latestStep}
            >
              Fill out my form
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
            On December 28, 2020, New York State passed legislation that
            protects tenants from eviction due to lost income or COVID-19 health
            risks. In order to get protected, you must fill out a hardship
            declaration form and send it to your landlord and/or the courts.
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
              For New York State tenants
            </h2>
            <p>
              All tenants in New York State have a right to fill out this
              hardship declaration form. However, if you've been served an
              eviction notice or believe you are at risk of being evicted,
              please consider using this form to protect yourself.
            </p>
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
              Our free tool was built by the Right to Counsel NYC Coalition,
              Housing Justice for All, and JustFix.nyc as part of the larger
              tenant movement across the state.
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
              After sending your hardship declaration form, connect with local
              organizing groups to get involved in the fight to make New York
              eviction free, cancel rent, and more!
            </p>
          </div>
        </div>
      </div>
    </section>

    <EvictionFreeFaqsPreview />
  </Page>
);
