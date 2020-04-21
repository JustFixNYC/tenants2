import React from "react";
import { StaticImage } from "../ui/static-image";
import { getImageSrc } from "./homepage";
import { Link } from "react-router-dom";
import { NorentRoutes } from "./routes";
import { FaqsContent, Faq, FaqCategory } from "./data/faqs-content";
import Page from "../ui/page";

const FAQS_PAGE_CATEGORIES_IN_ORDER: FaqCategory[] = [
  "Letter Builder",
  "Tenant Rights",
  "Connecting With Others",
  "After Sending Your Letter",
];

function sortFaqsByPriority(data: Faq[]) {
  return data.sort((faq1, faq2) => faq1.priority - faq2.priority);
}

function generateFaqsListFromData(data: Faq[], isPreview?: boolean) {
  return sortFaqsByPriority(data).map((faq, i) => (
    <div className="jf-accordion-item jf-space-below-2rem" key={i}>
      <details className="has-text-left jf-space-below-2rem">
        <summary>
          <div className="media">
            <div className="media-content">
              <span className="title jf-alt-title-font is-size-5 has-text-dark">
                {faq.question}
              </span>
            </div>
            <div className="media-right">
              <ChevronIcon />
            </div>
          </div>
        </summary>
        {isPreview ? faq.answerPreview : faq.answerFull}
      </details>
    </div>
  ));
}

const ChevronIcon = () => (
  <StaticImage ratio="is-16x16" src={getImageSrc("chevron")} alt="" />
);

export const NorentFaqsPreview = () => {
  const FaqsPreviewContent = FaqsContent.filter((faq) => faq.priority < 5);
  return (
    <section className="hero jf-faqs-preview">
      <div className="hero-body">
        <div className="container jf-tight-container jf-has-text-centered-tablet jf-space-below-2rem">
          <h3 className="is-spaced has-text-weight-normal is-size-5">
            Sending a letter to your landlord is a big step. Here are a few{" "}
            {/* REPLACE once routes are set up */}
            <Link to={NorentRoutes.locale.faqs}>
              frequently asked questions
            </Link>{" "}
            from people who have used our tool:
          </h3>
          <br />
          <div className="jf-space-below-2rem">
            {generateFaqsListFromData(FaqsPreviewContent, true)}
          </div>
          <Link
            to={NorentRoutes.locale.faqs}
            className="is-size-5 has-text-weight-normal"
          >
            See more FAQs
          </Link>
        </div>
      </div>
    </section>
  );
};

export const NorentFaqsPage: React.FC<{}> = () => {
  return (
    <Page title="FAQs" className="content">
      <section className="hero is-info is-medium">
        <div className="hero-body">
          <div className="container jf-has-text-centered-tablet">
            <h2 className="title is-spaced">Frequently Asked Questions</h2>
            <br />
            <p className="subtitle">
              Sending a letter to your landlord is a big step. Check out our
              frequently asked questions from people who have used our tool:
            </p>
          </div>
        </div>
      </section>

      <div className="hero">
        <div className="hero-body">
          <div className="container">
            <br />
            {FAQS_PAGE_CATEGORIES_IN_ORDER.map((category, i) => {
              const faqs = FaqsContent.filter(
                (faq) => faq.category === category
              );
              return (
                faqs.length > 0 && (
                  <div className="has-text-left" key={i}>
                    <p className="is-size-7 is-uppercase has-text-info has-text-weight-bold is-marginless">
                      {category}
                    </p>
                    <br />
                    <div>{generateFaqsListFromData(faqs)}</div>
                    <div className="jf-space-below-2rem">
                      <Link className="has-text-weight-normal" to="#main">
                        Back to top
                      </Link>
                    </div>
                    <br />
                  </div>
                )
              );
            })}
          </div>
        </div>
      </div>
    </Page>
  );
};
