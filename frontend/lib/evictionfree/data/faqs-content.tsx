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
    question: `Is this free?`,
    previewOptions: {
      priorityInPreview: 1,
      answerPreview: (
        <p>
          Yes, this is a free website created by 501(c)3 non-profit
          organizations.
        </p>
      ),
    },
    answerFull: (
      <p>
        Yes, this is a free website created by 501(c)3 non-profit organizations.
      </p>
    ),
  },
  {
    question: `Do I have to go to the post office to mail my declaration?`,
    previewOptions: {
      priorityInPreview: 2,
      answerPreview: (
        <p>
          No, you can use this website to send a letter to your landlord via
          email or USPS mail. You do not have to pay for the letter to be
          mailed. If you choose not to use this tool, you will be responsible
          for mailing your declaration.
        </p>
      ),
    },
    answerFull: (
      <p>
        No, you can use this website to send a letter to your landlord via email
        or USPS mail. You do not have to pay for the letter to be mailed. If you
        choose not to use this tool, you will be responsible for mailing your
        declaration.
      </p>
    ),
  },
  {
    question: `I’m undocumented. Can I use this tool?`,
    previewOptions: {
      priorityInPreview: 3,
      answerPreview: (
        <p>
          Yes, the protections outlined by New York State law apply to you
          regardless of immigration status.
        </p>
      ),
    },
    answerFull: (
      <p>
        Yes, the protections outlined by New York State law apply to you
        regardless of immigration status.
      </p>
    ),
  },
  {
    question: `I live in another state that isn’t New York. Is this tool for me?`,
    previewOptions: {
      priorityInPreview: 4,
      answerPreview: (
        <p>
          No. Unfortunately, these protections only apply to residents of New
          York State.
        </p>
      ),
    },
    answerFull: (
      <p>
        No. Unfortunately, these protections only apply to residents of New York
        State.
      </p>
    ),
  },
  {
    question: `Can I see what forms I’m sending before I fill them out?`,
    answerFull: (
      <p>
        When you use our tool, you will be able to preview your filled out form
        before sending it. You can also view a blank copy of the Hardship
        Declaration form.
      </p>
    ),
  },
  {
    question: `Is the online tool the only way to submit this form?`,
    answerFull: (
      <>
        <p>
          No! You can print out the Hardship Declaration form yourself, fill it
          out by hand, and mail/email it to your landlord and local housing
          court.
        </p>

        <p>
          New York City residents can send their declarations to the court in
          their borough:
        </p>
        <ul>
          <li>
            <p>Manhattan Housing Court: </p>
            <ul>
              <li>Address: 111 Centre Street, New York, NY 10013</li>
              <li>Email: NewYorkHardshipDeclaration@nycourts.gov</li>
            </ul>
            <p>Bronx Housing Court </p>
            <ul>
              <li>Address: 1118 Grand Concourse, Bronx, NY 10456</li>
              <li>Email: BronxHardshipDeclaration@nycourts.gov </li>
            </ul>
            <p>Brooklyn Housing Court </p>
            <ul>
              <li>Address: 141 Livingston St, Brooklyn, NY 11201</li>
              <li>Email: KingsHardshipDeclaration@nycourts.gov</li>
            </ul>
            <p>Queens Housing Court </p>
            <ul>
              <li>Address: 89-17 Sutphin Boulevard, Jamaica, New York 11435</li>
              <li>Email: QueensHardshipDeclaration@nycourts.gov</li>
            </ul>
            <p>Staten Island Housing Court </p>
            <ul>
              <li>
                Address: 927 Castleton Avenue, Staten Island, New York 10310
              </li>
              <li>Email: RichmondHardshipDeclaration@nycourts.gov </li>
            </ul>
          </li>
        </ul>
      </>
    ),
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
