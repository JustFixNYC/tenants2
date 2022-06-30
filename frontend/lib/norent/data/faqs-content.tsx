import React from "react";
import { OutboundLink } from "../../ui/outbound-link";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { LocalizedOutboundLink } from "../../ui/localized-outbound-link";

export type FaqCategory =
  | "Letter Builder"
  | "Tenant Rights"
  | "Connecting With Others"
  | "After Sending Your Letter"
  | "States with Limited Protections";

type FaqCategoryLabels = {
  [k in FaqCategory]: string;
};

export function getFaqCategoryLabels(): FaqCategoryLabels {
  return {
    "Letter Builder": li18n._(t`Letter Builder`),
    "Tenant Rights": li18n._(t`Tenant Rights`),
    "Connecting With Others": li18n._(t`Connecting With Others`),
    "After Sending Your Letter": li18n._(t`After Sending Your Letter`),
    "States with Limited Protections": li18n._(
      t`States with Limited Protections`
    ),
  };
}

export const SendCDCDeclarationBlurb: React.FC<{}> = () => (
  <Trans id="norent.sendCDCDeclarationBlurb">
    You may want to{" "}
    <LocalizedOutboundLink
      hrefs={{
        en: "https://www.covid19evictionforms.com/",
        es: "https://www.es.covid19evictionforms.com/",
      }}
    >
      send a declaration
    </LocalizedOutboundLink>{" "}
    under the Order issued by the Centers for Disease Control and Prevention
    (CDC) to provide renters with protection from eviction. Learn more about the
    CDC declaration before sending your landlord a notice.
  </Trans>
);

type FaqPreviewOptions = {
  priorityInPreview: number; // Not Localized
  answerPreview: React.ReactNode; // Localized
};

export type Faq = {
  question: string; // Localized
  category: FaqCategory; // Not localized here, but gets localized in the front-end by the getFaqCategoryLabels() function
  answerFull: React.ReactNode; // Localized
  previewOptions?: FaqPreviewOptions;
};

// COMMON OUTBOUND LINKS

const LawHelpLink = () => (
  <OutboundLink
    className="has-text-weight-normal"
    href="https://www.lawhelp.org/"
    target="_blank"
    rel="noopener noreferrer"
  >
    LawHelp.org
  </OutboundLink>
);

const RightToTheCityLink = () => (
  <OutboundLink
    className="has-text-weight-normal"
    href="https://righttothecity.org/"
    target="_blank"
    rel="noopener noreferrer"
  >
    Right to the City Alliance
  </OutboundLink>
);

const CancelRentLink = () => (
  <OutboundLink
    className="has-text-weight-normal"
    href="https://cancelrent.us/"
    target="_blank"
    rel="noopener noreferrer"
  >
    cancelrent.us
  </OutboundLink>
);

const RentStrike2020Link = () => (
  <OutboundLink
    className="has-text-weight-normal"
    href="https://thenewinquiry.com/rent-strike-2020/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Trans>Rent Strike 2020: A Resource List</Trans>
  </OutboundLink>
);

const EmergencyTenantProtectionsMapLink = () => (
  <OutboundLink
    className="has-text-weight-normal"
    href="https://antievictionmappingproject.github.io/covid-19-map/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Trans>COVID-19 Emergency Tenant Protections & Rent Strikes Map</Trans>
  </OutboundLink>
);

const MHActionLink = () => (
  <OutboundLink
    className="has-text-weight-normal"
    href="https://actionnetwork.org/forms/join-mhactions-fight-to-ensure-all-families-have-a-place-to-call-home/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Trans>Click here to join MHAction’s movement</Trans>
  </OutboundLink>
);

// COMMON BLOCKS OF CONTENT

const NonpaymentDocumentation = () => (
  <Trans id="norent.listOfSuggestedNonpaymentDocumentation">
    <p>
      While you wait for your landlord to respond, gather as much documentation
      as you can. Some types of documentation you can gather include:
    </p>
    <ul>
      <li>
        <span className="has-text-weight-semibold">Employer Letter</span>: A
        letter from your employer or a co-worker citing COVID-19 showing job
        loss or hours reduction as a result of COVID-19.
      </li>
      <li>
        <span className="has-text-weight-semibold">
          Unemployment Benefits Documents
        </span>
        : These are documents that show you’ve applied for or received benefits
        from the Employment Development Department.
      </li>
      <li>
        <span className="has-text-weight-semibold">Paystubs</span>: These can be
        paychecks from before you were terminated or laid-off. If you have had a
        change in hours, you can send your paychecks before and after that
        change.
      </li>
      <li>
        <span className="has-text-weight-semibold">
          COVID-19 related expenses
        </span>
        : These can be receipts showing that you have had increased expenses
        from issues resulting from the coronavirus, including childcare costs,
        expenses from complying with public health directives, or other related
        expenses.
      </li>
      <li>
        <span className="has-text-weight-semibold">Child’s Enrollment</span>:
        This might be a notice that your child’s school has closed due to
        COVID-19. Evidence of your child’s enrollment may also be included.
      </li>
      <li>
        <span className="has-text-weight-semibold">Financial Statements</span>:
        These can be budgets, bank statements, or personal records demonstrating
        how your income was interrupted by COVID-19 related disruption to your
        job or business. Be sure to avoid sending any sensitive personal
        financial information you may not want your landlord to view.
      </li>
      <li>
        <span className="has-text-weight-semibold">
          COVID-19 Medical records
        </span>
        : This might include extraordinary out-of-pocket medical expenses
        related to the diagnosis and testing for and/or treatment of COVID-19.
        Due to the sensitivity of medical records, you may not want to send
        these to your landlord. However, you should keep these expenses for your
        own record. This can be used as evidence in case you are asked in court
        proceedings to provide evidence of extraordinary out-of-pocket
        COVID-19-related medical expenses for you or a family member.
      </li>
      <li>
        <span className="has-text-weight-semibold">
          Other evidence of COVID-19 related financial impact
        </span>
        : This can be any other evidence that demonstrates how COVID-19 has
        impacted your ability to pay rent.
      </li>
    </ul>
  </Trans>
);

export const NorentNonpaymentDocumentation = NonpaymentDocumentation;

const ConnectWithLawyer = () => (
  <Trans>
    <p>
      If you’re facing an emergency, you can find further legal assistance in
      your state at <LawHelpLink />.
    </p>
  </Trans>
);

const LandlordRetaliation = () => (
  <Trans id="norent.whatToDoIfLandlordRetaliates">
    <p>
      It’s normal to feel anxious or scared that your landlord will retaliate.
      If your landlord is harassing you, denying you repairs, or trying to
      illegally evict you, reach out to legal assistance at <LawHelpLink /> and
      connect with tenant organizers at <RightToTheCityLink />.
    </p>
  </Trans>
);

const ConnectWithOrganizers = () => (
  <Trans id="norent.instructionsForConnectingWithOrganizers">
    <p>
      Connect to organizers through the <RightToTheCityLink />, a national
      alliance of organizers building the tenant movement since 2007. You can
      join their call for renters across the country to fight for the
      cancellation of rent at <CancelRentLink />.
    </p>
  </Trans>
);

const CollectiveOrganizing = () => (
  <Trans id="norent.infoAboutCollectiveOrganizing">
    <p>
      The most important place to start is where you live. Connect safely with
      other tenants in your building or home and start by organizing a means of
      communicating with one another to find out what issues and needs you share
      in common.
    </p>
    <p>
      For more resources on forming a tenant union check out{" "}
      <RentStrike2020Link />. You may also connect with local organizing groups
      affiliated with the national <RightToTheCityLink />.
    </p>
  </Trans>
);

/**
 * Get all content for FAQ entries throughout the site.
 *
 * The order of entries in this array determines the order in which entries appear on the FAQs page,
 * once entries are sorted by category.
 *
 * For any FAQ preview section, only entries that have priorityInPreview defined will be shown,
 * and these entries will be sorted by their priorityInPreview number.
 */
export const getFaqsContent: () => Faq[] = () => [
  {
    question: li18n._(t`I'm scared. What happens if my landlord retaliates?`),
    category: "After Sending Your Letter",
    previewOptions: {
      priorityInPreview: 1,
      answerPreview: <LandlordRetaliation />,
    },
    answerFull: <LandlordRetaliation />,
  },
  {
    question: li18n._(t`Is this free?`),
    category: "Letter Builder",
    previewOptions: {
      priorityInPreview: 2,
      answerPreview: (
        <Trans>
          <p>
            Yes, this is a free website created by 501(c)3 non-profit
            organizations across the United States.
          </p>
        </Trans>
      ),
    },
    answerFull: (
      <Trans>
        <p>
          Yes, this is a free website created by 501(c)3 non-profit
          organizations across the United States.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`Do I have to go to the post office to mail my letter?`),
    category: "Letter Builder",
    previewOptions: {
      priorityInPreview: 3,
      answerPreview: (
        <Trans>
          <p>
            No, you can use this website to send a letter to your landlord via
            email or USPS mail. You do not have to pay for the letter to be
            mailed.
          </p>
        </Trans>
      ),
    },
    answerFull: (
      <Trans>
        <p>
          No, you can use this website to send a letter to your landlord via
          email or USPS mail. You do not have to pay for the letter to be
          mailed.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(
      t`Is there someone I can connect with after this to get help?`
    ),
    category: "Connecting With Others",
    previewOptions: {
      priorityInPreview: 4,
      answerPreview: <ConnectWithOrganizers />,
    },
    answerFull: (
      <Trans id="norent.additionalInstructionsForConnectingWithOrganizers">
        <ConnectWithOrganizers />
        <p>
          You can also connect with your neighbors and organize your building to
          demand more by taking collective action. Read more about forming
          tenant unions and starting a rent strike at <RentStrike2020Link />.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`What does this tool do?`),
    category: "Letter Builder",
    answerFull: (
      <Trans id="norent.explanationOfWhatToolDoes">
        <p>
          NoRent.org guides you through the process of notifying your landlord
          that you cannot pay the rent due to a COVID-19 related issue. We’ll
          also help you learn more about the rights that protect tenants in your
          state and refer you to resources to take legal or organizing action.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`Is this tool right for me?`),
    category: "Letter Builder",
    answerFull: (
      <Trans id="norent.whoThisToolIsFor">
        <p>
          If you’re not able to pay the rent this month because of a COVID-19
          related issue (i.e. employment changes, loss of income, medical
          expenses, or loss of childcare) this tool is for you. Although the
          rules for exercising your rights will vary by state, NoRent.org can
          help walk you through the complexities and connect you to resources.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(
      t`Why should I notify my landlord if I can’t pay my rent?`
    ),
    category: "Tenant Rights",
    answerFull: (
      <Trans id="norent.whyYouShouldNotifyAboutNotPayingRent">
        <p>
          In some states, in order to benefit from the eviction protections that
          elected officials have put in place you should notify your landlord of
          your non-payment for reasons related to COVID-19. In the event that
          your landlord tries to evict you, the courts may view this as a
          proactive step that helps establish your defense.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`What does an eviction moratorium mean?`),
    category: "Tenant Rights",
    answerFull: (
      <Trans id="norent.definitionOfEvictionMoratorium">
        <p>
          An “eviction moratorium” can mean something different in every
          jurisdiction, but in short, a moratorium temporarily pauses certain
          types of evictions.
        </p>
        <p>
          The exact means by which this pause is enforced and the types of cases
          that are paused, varies across cities and states. Depending on the
          jurisdiction, courts may simply be closed or not processing eviction
          filings, sheriffs may not be enforcing eviction orders, or there may
          be some combination of these and other methods of suspending
          evictions.
        </p>
        <p>
          NoRent.org will support you with the process of navigating these
          different rules. You can also read more about the tenant protections
          in your jurisdiction at the Anti-Eviction Mapping Project’s{" "}
          <EmergencyTenantProtectionsMapLink />.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`What happens when the eviction moratorium ends?`),
    category: "Tenant Rights",
    answerFull: (
      <Trans id="norent.explanationOfWhatHappensWhenEvictionMoratoriumEnds">
        <p>
          Once a moratorium is lifted, eviction processes in courts and
          enforcement by local law enforcement may resume.
        </p>
        <p>
          If we don’t win additional demands (such as a rent freeze and
          suspension of rent payments) before the end of these “eviction
          moratoriums”, then cases will restart, evictions will continue, and
          new cases will be filed.
        </p>
        <p>
          We are working hard to push for an immediate rent freeze and rent
          suspension, among other demands. This is the time to organize! Get
          involved at <CancelRentLink />.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(
      t`Is not paying my rent because of COVID-19 considered a “rent strike”?`
    ),
    category: "Tenant Rights",
    answerFull: (
      <Trans id="norent.explanationOfWithholdingRent">
        <p>
          There’s a difference between a “rent strike”, or withholding rent, and
          not paying rent. This letter notifies the landlord that you’re not
          paying rent due to financial impacts of COVID-19, which is a way of
          delaying rent payments now.
        </p>
        <p>
          Withholding your rent, or a rent strike, is declaring that you will
          not pay the rent, regardless of whether you’re able to. This may put
          you at risk of legal eviction for failure to pay the rent. You should
          never withhold rent alone and should only do so when you have gotten
          the support and buy-in of everyone in your building.
        </p>
        <p>
          While this is risky, withholding rent can be an important tactic for
          tenants to build a movement. If your neighbors are considering a rent
          strike, you may want to refer to the resources below on how to
          organize, and to contact organizations that have provided tools and
          resources.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(
      t`How do I organize with other tenants in my building, block, or neighborhood?`
    ),
    category: "Connecting With Others",
    answerFull: <CollectiveOrganizing />,
  },
  {
    question: li18n._(t`How can I connect with a lawyer?`),
    category: "Connecting With Others",
    answerFull: <ConnectWithLawyer />,
  },
  {
    question: li18n._(t`What if I live in a manufactured or mobile home?`),
    category: "Connecting With Others",
    answerFull: (
      <Trans id="norent.howToConnectWithManufacturedHomeOwners">
        <p>
          Join a movement of manufactured homeowners who are standing together
          to make their communities affordable, healthy, safe, and beautiful
          places to live. Mobile Home/Manufactured Home Owners: <MHActionLink />{" "}
          to hold corporate community owners accountable.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`What happens after I send this letter?`),
    category: "After Sending Your Letter",
    answerFull: (
      <Trans id="norent.instructionsForAfterSendingLetter">
        <p>
          After you send this letter, your landlord may get in touch with you to
          ask for more information or discuss a repayment plan. Make sure all
          your communication is documented by letter, email, or text message.
          Avoid engaging in negotiation other than agreeing to pay a reasonable
          portion of your rent that you are sure you can afford without putting
          your health at risk. Don’t agree to move. You can find further legal
          assistance at <LawHelpLink />.
        </p>
        <p>
          You should continue to collect documentation that shows you’ve been
          financially impacted by COVID-19.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`Will I still owe my rent after I send this letter?`),
    category: "After Sending Your Letter",
    answerFull: (
      <Trans id="norent.whyYouStillOweRentAfterSendingLetter">
        <p>
          Yes, you’ll still owe rent after sending the letter because our state
          and federal governments have not adopted a rent cancellation policy.
          Call for cancellation of rent at <CancelRentLink />.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(t`Help! My landlord is already trying to evict me.`),
    category: "After Sending Your Letter",
    answerFull: (
      <Trans>
        <p>
          If your landlord is trying to illegally evict you, reach out to legal
          assistance at <LawHelpLink /> immediately.
        </p>
      </Trans>
    ),
  },
  {
    question: li18n._(
      t`What kind of documentation should I collect to prove I can’t pay rent?`
    ),
    category: "After Sending Your Letter",
    answerFull: <NonpaymentDocumentation />,
  },
  {
    question: li18n._(t`How can I document my hardships related to COVID-19?`),
    category: "States with Limited Protections",
    answerFull: <NonpaymentDocumentation />,
  },
  {
    question: li18n._(t`How can I connect with a lawyer?`),
    category: "States with Limited Protections",
    answerFull: <ConnectWithLawyer />,
  },
  {
    question: li18n._(t`How can I build collective power with other tenants?`),
    category: "States with Limited Protections",
    answerFull: <CollectiveOrganizing />,
  },
];

export type FaqWithPreviewOptions = Faq & {
  previewOptions: FaqPreviewOptions;
};

/**
 * Return a list of all FAQs with preview options, pre-sorted to reflect
 * their priority.
 */
export const getFaqsWithPreviewContent: () => FaqWithPreviewOptions[] = () => {
  const results = [];

  for (let faq of getFaqsContent()) {
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
