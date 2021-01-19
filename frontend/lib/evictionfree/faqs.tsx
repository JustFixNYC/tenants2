import { Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { Accordion } from "../ui/accordion";
import Page from "../ui/page";
import {
  EvictionFreeFaq,
  getEvictionFreeFaqsContent,
  getEvictionFreeFaqsWithPreviewContent,
} from "./data/faqs-content";
import { EvictionFreeRoutes } from "./route-info";

function generateFaqsListFromData(
  data: EvictionFreeFaq[],
  isPreview?: boolean
) {
  return data.map((faq, i) => (
    <Accordion
      key={i}
      question={faq.question}
      questionClassName="title jf-alt-title-font is-size-5"
    >
      {isPreview ? faq.previewOptions?.answerPreview : faq.answerFull}
    </Accordion>
  ));
}

export const EvictionFreeFaqsPreview = () => {
  return (
    <section className="hero jf-faqs-preview">
      <div className="hero-body">
        <div className="container jf-tight-container jf-has-text-centered-tablet jf-space-below-2rem">
          <h3 className="is-spaced has-text-weight-normal is-size-5">
            Sending a letter to your landlord is a big step. Here are a few{" "}
            <Link to={EvictionFreeRoutes.locale.faqs}>
              frequently asked questions
            </Link>{" "}
            from people who have used our tool:
          </h3>
          <br />
          <div className="jf-space-below-2rem">
            {generateFaqsListFromData(
              getEvictionFreeFaqsWithPreviewContent(),
              true
            )}
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
    <Page title="FAQs" className="content">
      <section className="hero is-medium">
        <div className="hero-body">
          <div className="container jf-has-text-centered-tablet">
            <h2 className="title is-spaced has-text-info">
              Frequently Asked Questions
            </h2>
            <br />
            <p className="subtitle">
              Navigating these laws is confusing. Check out our frequently asked
              questions from people who have used our tool:
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
