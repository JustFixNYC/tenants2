import React from "react";
import Page from "../ui/page";
import {
  JumpArrow,
  BuildMyLetterButton,
  StickyLetterButtonContainer,
  LandingPageChecklist,
  getImageSrc,
} from "./homepage";
import { NorentFaqsPreview } from "./faqs";
import { StaticImage } from "../ui/static-image";
import { LetterPreview } from "../static-page/letter-preview";
import { NorentRoutes } from "./routes";

export const NorentAboutYourLetterPage: React.FC<{}> = () => (
  <Page title="About Your Letter" className="content">
    <section className="hero">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced has-text-info">About Your Letter</h2>
          <br />
          <p className="subtitle">
            Not being able to pay rent due to COVID-19 is nothing to be ashamed
            of. Our letter builder makes it easy to send a letter to your
            landlord.
          </p>
          <br />
          <BuildMyLetterButton isHiddenMobile />
          <br />
        </div>
      </div>
      <div className="container jf-has-centered-images jf-space-below-2rem">
        <JumpArrow to="#more-info" altText="Learn more" />
      </div>
    </section>

    <StickyLetterButtonContainer containerId="more-info">
      <section className="hero">
        <div className="hero-body">
          <div className="container jf-tight-container jf-has-centered-images jf-space-below-2rem">
            <StaticImage
              ratio="is-128x128"
              src={getImageSrc("question")}
              alt=""
            />
            <h2 className="title is-spaced">Why send a letter</h2>
            <p className="subtitle is-size-4">
              Here are a few benefits to sending a letter to your landlord:
            </p>
            <br />
            <ul>
              <li>
                <p className="title is-size-6">Exercise your rights</p>
                <p>
                  Benefit from the eviction protections that local elected
                  officials have put in place, by notifying your landlord of
                  your inability to pay rent for reasons related to COVID-19
                </p>
              </li>
              <br />
              <li>
                <p className="title is-size-6">Establish your defense</p>
                <p>
                  In the event that your landlord tries to evict you, the courts
                  will see this as a proactive step that helps establish your
                  defense.
                </p>
              </li>
            </ul>
            <br />
            <BuildMyLetterButton isHiddenMobile />
          </div>
        </div>
      </section>

      <LandingPageChecklist />

      <section className="hero">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h3 className="is-spaced has-text-weight-normal">
              Here’s what the letter will look like:
            </h3>
            <br />
            <LetterPreview
              title="Preview of your NoRent.org letter"
              src={NorentRoutes.locale.sampleLetterContent.html}
            />
          </div>
        </div>
      </section>
      <NorentFaqsPreview />
    </StickyLetterButtonContainer>
  </Page>
);
