import { t, Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { li18n } from "../i18n-lingui";
import { Accordion } from "../ui/accordion";
import Page from "../ui/page";
import {
  EvictionFreeFaq,
  getEvictionFreeFaqsContent,
  getEvictionFreeFaqsWithPreviewContent,
  RightToCounselFaqsLink,
} from "./data/faqs-content";
import { EvictionFreeRoutes } from "./route-info";

function generateFaqsListFromData(data: EvictionFreeFaq[]) {
  return data.map((faq, i) => (
    <Accordion
      key={i}
      question={faq.question}
      questionClassName="title jf-alt-title-font is-size-5"
    >
      {faq.answer}
    </Accordion>
  ));
}

export const EvictionFreeFaqsPreview = () => {
  return (
    <section className="hero jf-faqs-preview">
      <div className="hero-body">
        <div className="container jf-tight-container jf-has-text-centered-tablet jf-space-below-2rem">
          <h3 className="is-spaced has-text-weight-normal is-size-5">
            <Trans>
              Navigating these laws is confusing. Here are a few{" "}
              <Link to={EvictionFreeRoutes.locale.faqs}>
                frequently asked questions
              </Link>{" "}
              from people who have used our tool:
            </Trans>
          </h3>
          <br />
          <div className="jf-space-below-2rem">
            {generateFaqsListFromData(getEvictionFreeFaqsWithPreviewContent())}
          </div>
          <Link
            to={EvictionFreeRoutes.locale.faqs}
            className="is-size-5 has-text-weight-normal"
          >
            <Trans>See more FAQs</Trans>
          </Link>
        </div>
      </div>
    </section>
  );
};

export const EvictionFreeFaqsPage: React.FC<{}> = () => {
  const allFaqs = getEvictionFreeFaqsContent();

  return (
    <Page title={li18n._(t`FAQs`)} className="content">
      <section className="hero is-medium">
        <div className="hero-body">
          <div className="container jf-has-text-centered-tablet">
            <h2 className="title is-spaced">
              <Trans>Frequently Asked Questions</Trans>
            </h2>
            <br />
            <p className="subtitle">
              <Trans id="evictionfree.faqsPageIntro">
                Navigating these laws is confusing. Check out our frequently
                asked questions from people who have used our tool below. If you
                have questions about the state of housing court and the current
                status of eviction cases, check out
              </Trans>{" "}
              {/* This structure makes sure the link text doesn't wrap, except on mobile when it has to */}
              <span className="jf-word-glue is-hidden-mobile">
                <RightToCounselFaqsLink />
              </span>
              <span className="is-hidden-tablet">
                <RightToCounselFaqsLink />
              </span>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="hero jf-faqs" id="more-info">
        <div className="hero-body">
          <div className="container jf-tight-container">
            <br />
            {generateFaqsListFromData(allFaqs)}
          </div>
        </div>
      </section>
    </Page>
  );
};
