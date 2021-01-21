import React from "react";
import { Link } from "react-router-dom";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { EvictionFreeRoutes as Routes } from "./route-info";

type EvictionFreeImageType = "png" | "svg";

export function getEFImageSrc(name: string, type?: EvictionFreeImageType) {
  return `frontend/img/evictionfree/${name}.${type || "svg"}`;
}

export const EvictionFreeHomePage: React.FC<{}> = () => (
  <Page title="">
    <section className="hero is-fullheight-with-navbar">
      <div className="hero-body">
        <div className="columns">
          <div className="column is-three-fifths">
            <div className="content">
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
          </div>
          <div className="column">
            <StaticImage
              ratio="is-square"
              src={getEFImageSrc("forms")}
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  </Page>
);
