import { Trans, t } from "@lingui/macro";
import React from "react";
import { OutboundLink } from "../../ui/outbound-link";
import { li18n } from "../../i18n-lingui";
import { LocalizedOutboundLink } from "../../ui/localized-outbound-link";

export type EvictionFreeFaq = {
  question: string; // Localized
  answer: React.ReactNode; // Localized
  priorityInPreview?: number; // Not Localized
};

export const RightToCounselFaqsLink = () => (
  <LocalizedOutboundLink
    hrefs={{
      en: "https://www.righttocounselnyc.org/eviction_protections_during_covid",
      es: "https://www.righttocounselnyc.org/protecciones_contra_desalojos",
    }}
  >
    <Trans>Right to Counsel's FAQ page</Trans>
  </LocalizedOutboundLink>
);

const OutboundEmailLink: React.FC<{ email: string }> = ({ email }) => (
  <OutboundLink href={`mailto:${email}`}>{email}</OutboundLink>
);

const NycHousingCourtContactInfo = () => (
  <ul>
    <li>
      <p>
        <Trans>Manhattan Housing Court:</Trans>
      </p>
      <ul>
        <li>
          <Trans>Address:</Trans> 111 Centre Street, New York, NY 10013
        </li>
        <li>
          <Trans>Email:</Trans>{" "}
          <OutboundEmailLink email="NewYorkHardshipDeclaration@nycourts.gov" />
        </li>
      </ul>
    </li>
    <li>
      <p>
        <Trans>Bronx Housing Court:</Trans>
      </p>
      <ul>
        <li>
          <Trans>Address:</Trans> 1118 Grand Concourse, Bronx, NY 10456
        </li>
        <li>
          <Trans>Email:</Trans>{" "}
          <OutboundEmailLink email="BronxHardshipDeclaration@nycourts.gov" />
        </li>
      </ul>
    </li>
    <li>
      <p>
        <Trans>Brooklyn Housing Court:</Trans>
      </p>
      <ul>
        <li>
          <Trans>Address:</Trans> 141 Livingston St, Brooklyn, NY 11201
        </li>
        <li>
          <Trans>Email:</Trans>{" "}
          <OutboundEmailLink email="KingsHardshipDeclaration@nycourts.gov" />
        </li>
      </ul>
    </li>
    <li>
      <p>
        <Trans>Queens Housing Court:</Trans>
      </p>
      <ul>
        <li>
          <Trans>Address:</Trans> 89-17 Sutphin Boulevard, Jamaica, New York
          11435
        </li>
        <li>
          <Trans>Email:</Trans>{" "}
          <OutboundEmailLink email="QueensHardshipDeclaration@nycourts.gov" />
        </li>
      </ul>
    </li>
    <li>
      <p>
        <Trans>Staten Island Housing Court:</Trans>
      </p>
      <ul>
        <li>
          <Trans>Address:</Trans> 927 Castleton Avenue, Staten Island, New York
          10310
        </li>
        <li>
          <Trans>Email:</Trans>{" "}
          <OutboundEmailLink email="RichmondHardshipDeclaration@nycourts.gov" />
        </li>
      </ul>
    </li>
  </ul>
);

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
    question: li18n._(t`Is this free?`),
    priorityInPreview: 1,
    answer: (
      <p>
        <Trans>
          Yes, this is a free website created by 501(c)3 non-profit
          organizations.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(
      t`Do I have to go to the post office to mail my declaration?`
    ),
    priorityInPreview: 2,
    answer: (
      <p>
        <Trans id="evictionfree.postOfficeFaq">
          No, you can use this website to send a letter to your landlord via
          email or USPS mail. You do not have to pay for the letter to be
          mailed. If you choose not to use this tool, you will be responsible
          for mailing your declaration.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(
      t`I have a current eviction case in NYC. How do I connect with a lawyer?`
    ),
    priorityInPreview: 3,
    answer: (
      <p>
        <Trans>
          Visit <RightToCounselFaqsLink /> for information on how to connect
          with a lawyer.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(t`I’m undocumented. Can I use this tool?`),
    priorityInPreview: 4,
    answer: (
      <p>
        <Trans>
          Yes, the protections outlined by New York State law apply to you
          regardless of immigration status.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(
      t`Can I see what forms I’m sending before I fill them out?`
    ),
    answer: (
      <p>
        <Trans>
          When you use our tool, you will be able to preview your filled out
          form before sending it. You can also view a blank copy of the Hardship
          Declaration form.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(t`Is the online tool the only way to submit this form?`),
    answer: (
      <>
        <Trans id="evictionfree.printOutFaq">
          <p>
            No, you can print out the{" "}
            <LocalizedOutboundLink
              hrefs={{
                en:
                  "https://www.nycourts.gov/courts/nyc/SSI/images/corona/HardshipDeclaration.pdf",
                es:
                  "https://www.nycourts.gov/courts/nyc/SSI/images/corona/HardshipDeclaration_span.pdf",
              }}
            >
              hardship declaration form
            </LocalizedOutboundLink>{" "}
            yourself, fill it out by hand, and mail/email it to your landlord
            and local housing court.
          </p>
          <p>
            New York City residents can send their declarations to the court in
            their borough:
          </p>
        </Trans>
        <NycHousingCourtContactInfo />
      </>
    ),
  },
  {
    question: li18n._(
      t`What is the time lag between me filling this out and when it gets sent?`
    ),
    answer: (
      <p>
        <Trans id="evictionfree.timeLagFaq">
          Once you build your declaration form via this tool, it gets mailed
          and/or emailed immediately to your landlord and the courts. After it's
          sent, physical mail usually delivers in about a week.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(t`What is the deadline for filling out the declaration?`),
    answer: (
      <p>
        <Trans id="evictionfree.deadlineFaq1">
          You currently can submit your declaration form at any time between now
          and August 31, 2021. Once you submit your declaration form via this
          tool, we will mail and/or email it immediately to your landlord and
          the courts. If you’re ONLY sending your form via physical mail, send
          it as soon as possible and keep any proof of mailing and/or return
          receipts for your records.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(
      t`Is there a way to resend the declaration if the landlord claims they never received it?`
    ),
    answer: (
      <p>
        <Trans id="evictionfree.resendFaq">
          You currently cannot use this tool to send more than one declaration
          form. However, once you use this tool, you will be able to download a
          PDF copy of your declaration on the “Confirmation Page,” and you can
          choose to resend that declaration on your own. You should keep it for
          your records, in case your landlord tries to bring you to court.
        </Trans>
      </p>
    ),
  },
  {
    question: li18n._(
      t`I live in another state that isn’t New York. Is this tool for me?`
    ),
    answer: (
      <p>
        <Trans>
          No. Unfortunately, these protections only apply to residents of New
          York State.
        </Trans>
      </p>
    ),
  },
];

/**
 * Return a list of all FAQs with preview options, pre-sorted to reflect
 * their priority.
 */
export const getEvictionFreeFaqsWithPreviewContent: () => EvictionFreeFaq[] = () => {
  const results = [];

  for (let faq of getEvictionFreeFaqsContent()) {
    const { priorityInPreview } = faq;
    if (priorityInPreview) {
      results.push({ ...faq, priorityInPreview });
    }
  }

  results.sort((faq1, faq2) => faq1.priorityInPreview - faq2.priorityInPreview);

  return results;
};
