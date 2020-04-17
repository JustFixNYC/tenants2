import React from "react";
import { StaticImage } from "../ui/static-image";
import { getImageSrc, BuildMyLetterButton } from "./homepage";
import { Link } from "react-router-dom";
import { NorentRoutes } from "./routes";

const FaqsContent = [
  [
    "I'm scared. What happens if my landlord retaliates?",
    <p>
      It’s normal to feel anxious or scared that your landlord will retaliate.
      Remember: it is illegal for your landlord to evict you at this time due to
      reasons of non payment related to COVID-19. It is also illegal for your
      landlord to harass you or deny you repairs. If your landlord engages in
      any of this behavior, contact your local housing rights organization.
    </p>,
  ],
  [
    "Is this free?",
    <p>
      It’s normal to feel anxious or scared that your landlord will retaliate.
      Remember: it is illegal for your landlord to evict you at this time due to
      reasons of non payment related to COVID-19. It is also illegal for your
      landlord to harass you or deny you repairs. If your landlord engages in
      any of this behavior, contact your local housing rights organization.
    </p>,
  ],
  [
    "Do I have to go to the post office to mail it?",
    <p>
      It’s normal to feel anxious or scared that your landlord will retaliate.
      Remember: it is illegal for your landlord to evict you at this time due to
      reasons of non payment related to COVID-19. It is also illegal for your
      landlord to harass you or deny you repairs. If your landlord engages in
      any of this behavior, contact your local housing rights organization.
    </p>,
  ],
  [
    "Is there someone I can connect with after this to get help?",
    <p>
      It’s normal to feel anxious or scared that your landlord will retaliate.
      Remember: it is illegal for your landlord to evict you at this time due to
      reasons of non payment related to COVID-19. It is also illegal for your
      landlord to harass you or deny you repairs. If your landlord engages in
      any of this behavior, contact your local housing rights organization.
    </p>,
  ],
];

export const NorentFaqsPreview = () => {
  const chevronIcon = (
    <StaticImage ratio="is-16x16" src={getImageSrc("chevron")} alt="" />
  );
  return (
    <section className="hero jf-faqs-preview">
      <div className="hero-body">
        <div className="container jf-tight-container has-text-centered jf-space-below-2rem">
          <h3 className="is-spaced has-text-weight-normal">
            Sending a letter to your landlord is a big step. Here are a few{" "}
            {/* REPLACE once routes are set up */}
            <Link to={NorentRoutes.locale.home}>
              frequently asked questions
            </Link>{" "}
            from people who have used our tool:
          </h3>
          <br />
          <div className="jf-space-below-2rem">
            {FaqsContent.map((faq, i) => (
              <div className="jf-accordion-item jf-space-below-2rem" key={i}>
                <details className="has-text-left jf-space-below-2rem">
                  <summary>
                    <div className="title is-size-5 has-text-dark">
                      {faq[0]}
                    </div>
                    <div>{chevronIcon}</div>
                  </summary>
                  {faq[1]}
                </details>
              </div>
            ))}
          </div>
          <div className="has-text-left">
            <Link
              to={NorentRoutes.locale.faqs}
              className="is-size-6 has-text-weight-normal"
            >
              See more FAQs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export const NorentFaqsPage: React.FC<{}> = () => <NorentFaqsPreview />;
