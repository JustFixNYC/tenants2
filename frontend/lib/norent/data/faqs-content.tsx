import React from "react";

export type Faq = {
  question: string;
  category:
    | "Letter Builder"
    | "Tenant Rights"
    | "Connecting With Others"
    | "After Sending Your Letter";
  priority: number;
  answerPreview: React.ReactNode;
  answerFull: React.ReactNode;
};

export const FaqsContent:Faq[] = [
  {
    question: "I'm scared. What happens if my landlord retaliates?",
    category: "After Sending Your Letter",
    priority: 1,
    answerPreview: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
    answerFull: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
  },
  {
    question: "Is this free?",
    category: "Letter Builder",
    priority: 2,
    answerPreview: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
    answerFull: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
  },
  {
    question: "Do I have to go to the post office to mail  my letter?",
    category: "Letter Builder",
    priority: 3,
    answerPreview: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
    answerFull: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
  },
  {
    question: "Is there someone I can connect with after this to get help?",
    category: "Connecting With Others",
    priority: 4,
    answerPreview: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
    answerFull: (
      <p>
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </p>
    ),
  },
];
