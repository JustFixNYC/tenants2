import React from "react";

import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { PhoneNumber } from "./components/phone-number";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";

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
          you decide to contact the Los Angeles Housing Department (LAHD) or the
          appropriate department.
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
          <LocalizedOutboundLink
            hrefs={{
              en: "https://www.saje.net/what-we-do/tenant-action-clinic/",
              es:
                "https://espanol.saje.net/que-hacemos/clinica-de-accion-de-inquilinos/",
            }}
          >
            Tenant Action Clinic
          </LocalizedOutboundLink>
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
          If you live in the City of Los Angeles, call Urgent Repair Program at{" "}
          <PhoneNumber number="(213) 808-8562" />. If you live in a
          non-incorporated area of the County of Los Angeles, Call Consumer &
          Business Affairs at <PhoneNumber number="(800) 593-8222" />.
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
          your landlord is retaliating against you,{" "}
          <LocalizedOutboundLink
            hrefs={{
              en: "https://www.saje.net/what-we-do/tenant-action-clinic/",
              es:
                "https://espanol.saje.net/que-hacemos/clinica-de-accion-de-inquilinos/",
            }}
          >
            contact SAJE
          </LocalizedOutboundLink>{" "}
          to speak with a housing rights organizer.
        </Trans>
      </span>
    ),
  },
  {
    question: li18n._(t`I am undocumented. Can I send a letter?`),
    answer: (
      <span className="is-small">
        <Trans id="laletterbuilder.faq.undocumented">
          Yes, you can send a letter. Your immigration status does not affect
          your tenant rights.
        </Trans>
      </span>
    ),
  },
];
