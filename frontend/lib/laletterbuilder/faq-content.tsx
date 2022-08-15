import React from "react";

import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { OutboundLink } from "../ui/outbound-link";
import { PhoneNumber } from "./components/phone-number";

type FaqItem = {
  question: string;
  answer: JSX.Element;
};

export const getFaqContent: () => FaqItem[] = () => [
  {
    question: li18n._(t`When do I need to send a letter to my landlord?`),
    answer: (
      <span className="is-small">
        <Trans id="laletterbuilder.faq.whentosend">
          Create a letter to formally request repairs or document harassment
          situations. The letter creates a paper trail of your communication if
          you decide to contact the Los Angeles Housing Department (LAHD).
        </Trans>
      </span>
    ),
  },
  {
    question: li18n._(
      t`I’m not comfortable creating a letter on my own. Who can help me?`
    ),
    answer: (
      <span className="is-small">
        <Trans id="laletterbuilder.faq.whocanhelp">
          Give SAJE a call at <PhoneNumber number="(213) 745-9961" /> and let
          them know you need help creating a letter. You can also attend a{" "}
          <OutboundLink href="https://www.saje.net/what-we-do/tenant-action-clinic/">
            Tenant Action Clinic
          </OutboundLink>
          .
        </Trans>
      </span>
    ),
  },
  {
    question: li18n._(
      t`My issue is urgent and time sensitive. What should I do?`
    ),
    answer: (
      <span className="is-small">
        <Trans id="laletterbuilder.faq.timesensitive">
          If you live in the City of Los Angeles, call Urgent Repair Program at
          (213) 808-8562. If you live in a non-incorporated area of the County
          of Los Angeles, Call Consumer & Business Affairs at (800) 593-8222.
        </Trans>
      </span>
    ),
  },
  {
    question: li18n._(
      t`Can my landlord retaliate against me for sending a letter?`
    ),
    answer: (
      <span className="is-small">
        <Trans id="laletterbuilder.faq.retaliation">
          Exercising your tenant rights can be scary. Remember it is within your
          right to ask for repairs and live in a home free of harassment. If
          your landlord is retaliating against you, contact SAJE to speak with a
          housing rights organizer.
        </Trans>
      </span>
    ),
  },
  {
    question: li18n._(t`I am undocumented. Can I send a letter?`),
    answer: (
      <span className="is-small">
        <Trans id="laletterbuilder.faq.undocumented">
          Yes. Your immigration status does not affect your tenant rights.
        </Trans>
      </span>
    ),
  },
];
