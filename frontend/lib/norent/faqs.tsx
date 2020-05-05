import React from "react";
import { StaticImage } from "../ui/static-image";
import { getImageSrc, JumpArrow } from "./homepage";
import { Link } from "react-router-dom";
import { NorentRoutes } from "./routes";
import { FaqsContent, Faq, FaqCategory } from "./data/faqs-content";
import Page from "../ui/page";
import { ScrollyLink } from "../ui/scrolly-link";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

const FAQS_PAGE_CATEGORIES_IN_ORDER: FaqCategory[] = [
  "Letter Builder",
  "Tenant Rights",
  "Connecting With Others",
  "After Sending Your Letter",
  "States with Limited Protections",
];

export const STATES_WITH_LIMITED_PROTECTIONS_ID =
  "states_with_limited_protections";

export function getStatesWithLimitedProtectionsFAQSectionURL() {
  return `${NorentRoutes.locale.faqs}#${STATES_WITH_LIMITED_PROTECTIONS_ID}`;
}

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
              <span className="title jf-alt-title-font is-size-5">
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

export const ChevronIcon = () => (
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
    <Page title={li18n._(t`FAQs`)} className="content">
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
          </div>
        </div>
        <br />
        <div className="container jf-has-centered-images jf-space-below-2rem">
          <JumpArrow to="#more-info" altText="Browse the FAQs" />
          <br />
        </div>
      </section>

      <section className="hero jf-faqs" id="more-info">
        <div className="hero-body">
          <div className="container jf-tight-container">
            <br />
            {FAQS_PAGE_CATEGORIES_IN_ORDER.map((category, i) => {
              const faqs = FaqsContent.filter(
                (faq) => faq.category === category
              );

              const formatCategoryID = function (
                categoryTitle: string
              ): string {
                return categoryTitle.replace(/\s+/g, "_").toLowerCase();
              };

              return (
                faqs.length > 0 && (
                  <div className="has-text-left" key={i}>
                    <h5
                      id={formatCategoryID(category)}
                      className="is-size-7 is-uppercase has-text-info has-text-weight-bold is-marginless"
                    >
                      {category}
                    </h5>
                    <br />
                    <div>{generateFaqsListFromData(faqs)}</div>
                    <div className="jf-space-below-2rem">
                      <ScrollyLink
                        className="has-text-weight-normal"
                        to="#main"
                      >
                        Back to top
                      </ScrollyLink>
                    </div>
                    <br />
                  </div>
                )
              );
            })}
          </div>
        </div>
      </section>
    </Page>
  );
};
