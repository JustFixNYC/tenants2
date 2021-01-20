import React from "react";

type EvictionFreeFaqPreviewOptions = {
  priorityInPreview: number; // Not Localized
  answerPreview: React.ReactNode; // Localized
};

export type EvictionFreeFaq = {
  question: string; // Localized
  answerFull: React.ReactNode; // Localized
  previewOptions?: EvictionFreeFaqPreviewOptions;
};

/**
 * Get all content for FAQ entries throughout the site.
 *
 * The order of entries in this array determines the order in which entries appear on the FAQs page.
 *
 * For any FAQ preview section, only entries that have priorityInPreview defined will be shown,
 * and these entries will be sorted by their priorityInPreview number.
 */
export const getEvictionFreeFaqsContent: () => EvictionFreeFaq[] = () => [
  {
    question: `I'm scared. What happens if my landlord retaliates?`,
    previewOptions: {
      priorityInPreview: 1,
      answerPreview: <p>Blah!</p>,
    },
    answerFull: <p>Blah Blah!</p>,
  },
  {
    question: `Is this free?`,
    answerFull: <p>Blah Blah!</p>,
  },
];

export type EvictionFreeFaqWithPreviewOptions = EvictionFreeFaq & {
  previewOptions: EvictionFreeFaqPreviewOptions;
};

/**
 * Return a list of all FAQs with preview options, pre-sorted to reflect
 * their priority.
 */
export const getEvictionFreeFaqsWithPreviewContent: () => EvictionFreeFaqWithPreviewOptions[] = () => {
  const results = [];

  for (let faq of getEvictionFreeFaqsContent()) {
    const { previewOptions } = faq;
    if (previewOptions) {
      results.push({ ...faq, previewOptions });
    }
  }

  results.sort(
    (faq1, faq2) =>
      faq1.previewOptions.priorityInPreview -
      faq2.previewOptions.priorityInPreview
  );

  return results;
};
