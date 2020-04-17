import React from "react";
import { StaticImage } from "../ui/static-image";
import { getImageSrc } from "./homepage";
import { Link } from "react-router-dom";
import { NorentRoutes } from "./routes";
import { FaqsContent, Faq } from "./data/faqs-content";
import Page from "../ui/page";

const faqsPrioritySorter = (faq1: Faq, faq2: Faq) =>
  faq1.priority - faq2.priority;

const FaqsPreviewContent = FaqsContent.filter((faq) => faq.priority < 5).sort(
  faqsPrioritySorter
);

const chevronIcon = (
  <StaticImage ratio="is-16x16" src={getImageSrc("chevron")} alt="" />
);

export const NorentFaqsPreview = () => {
  return (
    <section className="hero jf-faqs-preview">
      <div className="hero-body">
        <div className="container jf-tight-container has-text-centered jf-space-below-2rem">
          <h3 className="is-spaced has-text-weight-normal">
            Sending a letter to your landlord is a big step. Here are a few{" "}
            {/* REPLACE once routes are set up */}
            <Link to={NorentRoutes.locale.faqs}>
              frequently asked questions
            </Link>{" "}
            from people who have used our tool:
          </h3>
          <br />
          <div className="jf-space-below-2rem">
            {FaqsPreviewContent.map((faq, i) => (
              <div className="jf-accordion-item jf-space-below-2rem" key={i}>
                <details className="has-text-left jf-space-below-2rem">
                  <summary>
                    <div className="title is-size-5 has-text-dark">
                      {faq.question}
                    </div>
                    <div>{chevronIcon}</div>
                  </summary>
                  {faq.answerPreview}
                </details>
              </div>
            ))}
          </div>
          <div className="has-text-left">
            <Link
              to={NorentRoutes.locale.faqs}
              className="is-size-5 has-text-weight-normal"
            >
              See more FAQs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export const NorentFaqsPage: React.FC<{}> = () => (
  <Page title="NoRent.org | FAQs" className="content">
    <section className="hero is-medium">
      <div className="hero-body">
        <div className="container jf-has-text-centered-tablet">
          <h2 className="title is-spaced has-text-info">
            Frequently Asked Questions
          </h2>
          <br />
          <p className="subtitle">
            Sending a letter to your landlord is a big step. Check out our
            frequently asked questions from people who have used our tool:
          </p>
          <br />
        </div>
      </div>
    </section>
  </Page>
);
