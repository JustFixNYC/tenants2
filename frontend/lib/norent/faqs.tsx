import React from "react";
import { StaticImage } from "../ui/static-image";
import { getImageSrc } from "./homepage";

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
    <div className="jf-space-below-2rem">
      {FaqsContent.map((faq, i) => (
        <div className="jf-accordion-item jf-space-below-2rem" key={i}>
          <details className="has-text-left jf-space-below-2rem">
            <summary>
              <div className="title is-size-5 has-text-dark">{faq[0]}</div>
              <div>{chevronIcon}</div>
            </summary>
            {faq[1]}
          </details>
        </div>
      ))}
    </div>
  );
};

export const NorentFaqsPage: React.FC<{}> = () => <NorentFaqsPreview />;
