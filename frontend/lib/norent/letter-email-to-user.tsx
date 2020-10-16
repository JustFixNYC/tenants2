import React from "react";

import { useContext } from "react";
import { AppContext } from "../app-context";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { NorentRoutes } from "./routes";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc.json";
import { assertNotNull } from "../util/util";
import { MessageDescriptor } from "@lingui/core";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";
import { HtmlEmail } from "../static-page/html-email";

type CaliforniaFAQProps = {
  question: MessageDescriptor;
  locality?: "IN LA" | "OUTSIDE LA" | "ALL CALIFORNIA";
  answer: JSX.Element;
};

const CALIFORNIA_FAQS: CaliforniaFAQProps[] = [
  {
    question: t`What is the new law AB3088?`,
    answer: (
      <>
        <p>
          <Trans id="norent.whatIsAB3088partOne">
            On August 31, 2020, the State of California passed tenant
            protections under Assembly Bill 3088. These protections prevent
            landlords from evicting tenants before February 1, 2021 without a
            valid reason or for any rent not paid between March 4 - January 31,
            2021 due to loss of income or increased expenses associated with
            COVID-19. Although this law protects you from being evicted for not
            paying rent, it does not cancel rent.
          </Trans>
        </p>
        <p>
          <Trans id="norent.whatIsAB3088partTwo">
            If you owe rent for any months from March 2020 to August 2020, you
            must submit a declaration form to your landlord for any months you
            do not pay. Now that you have used the NoRent website to mail or
            email the declaration to your landlord, your landlord cannot legally
            evict you for not paying rent.
          </Trans>
        </p>
      </>
    ),
  },
  {
    question: t`How does sending this declaration help me?`,
    answer: (
      <Trans id="norent.howDoesLetterHelpWithAB3088">
        <p>
          Using this declaration satisfies any local requirements to notify your
          landlord.
        </p>
        <ul>
          <li>
            It provides a defense to an eviction case based on nonpayment of
            rent; and
          </li>
          <li>
            It converts your rent to “civil debt.” This means that the landlord
            can file a small claims case for the unpaid rent. If a landlord gets
            a judgment for the unpaid rent in small claims court, the landlord
            can collect that judgment by garnishing the tenant’s paycheck,
            levying the tenant’s bank account, etc.
          </li>
        </ul>
      </Trans>
    ),
  },
  {
    question: t`Do I need to send this declaration every month?`,
    answer: (
      <p>
        <Trans id="norent.doINeedToSendAB3088LetterEveryMonth">
          Yes. Follow these instructions even if you have sent a letter to your
          landlord each month that you have not paid. And send a new declaration
          for every month moving forward (through January).
        </Trans>
      </p>
    ),
  },
  {
    question: t`What if I have more questions?`,
    locality: "IN LA",
    answer: (
      <>
        <p>
          <Trans>
            You can contact Strategic Actions for a Just Economy (SAJE) - a
            501c3 non-profit organization in South Los Angeles.
          </Trans>
        </p>
        <blockquote>
          <em>
            <Trans id="norent.sajeBlockQuote">
              Since 1996 SAJE has been a force for economic justice in our
              community focusing on tenant rights, healthy housing, and
              equitable development. SAJE believes that the fate of city
              neighborhoods should be decided by those who dwell there, and
              convenes with other organizations to ensure this occurs in a
              manner that is fair, replicable, and sustainable. Housing is a
              human right.
            </Trans>
          </em>
        </blockquote>
        <p>
          <strong>
            <Trans id="norent.sajePhoneCalls">
              Strategic Actions for a Just Economy (SAJE) is available for phone
              calls at (213) 745-9961, Monday-Friday from 10:00am-6:00pm.
            </Trans>
          </strong>
        </p>
        <Trans id="norent.sajeFacebookLive">
          <p>
            SAJE is also hosting Tenant Rights Q&amp;A every Wednesday on
            Facebook Live:
          </p>
          <ul>
            <li>English 11am-12pm</li>
            <li>Spanish 12:30pm-1:30pm</li>
          </ul>
        </Trans>
      </>
    ),
  },
  {
    question: t`What if I have more questions?`,
    locality: "OUTSIDE LA",
    answer: (
      <>
        <p>
          <Trans id="norent.tenantsTogetherDescription">
            You can contact Tenants Together, a statewide coalition of local
            tenant organizations dedicated to defending and advancing the rights
            of California tenants to safe, decent, and affordable housing.
          </Trans>
        </p>
        <p>
          <Trans>
            If you have questions about your rights as a tenant, please{" "}
            <LocalizedOutboundLink
              hrefs={{
                en: "https://www.tenantstogether.org/tenant-rights-hotline",
              }}
            >
              connect with Tenants Together
            </LocalizedOutboundLink>{" "}
            or find an attorney at{" "}
            <LocalizedOutboundLink
              hrefs={{
                en: "https://www.lawhelpca.org/",
                es: "https://www.lawhelpca.org/es",
              }}
            >
              Law Help California
            </LocalizedOutboundLink>
            .
          </Trans>
        </p>
      </>
    ),
  },
];

const CaliforniaFAQ: React.FC<
  CaliforniaFAQProps & {
    isInLosAngeles: boolean;
  }
> = (props) => {
  if (
    (props.locality === "IN LA" && !props.isInLosAngeles) ||
    (props.locality === "OUTSIDE LA" && props.isInLosAngeles)
  )
    return null;
  return (
    <>
      <h2>{li18n._(props.question)}</h2>
      {props.answer}
    </>
  );
};

const CaliforniaContent: React.FC<{ isInLosAngeles: boolean }> = ({
  isInLosAngeles,
}) => (
  <>
    <p>
      <Trans>
        Please read the rest of this email carefully as it contains important
        information about your next steps.
      </Trans>
    </p>
    {CALIFORNIA_FAQS.map((props, i) => (
      <CaliforniaFAQ key={i} {...props} isInLosAngeles={isInLosAngeles} />
    ))}
    <>
      <p>
        <strong>
          <em>
            <Trans>
              The above information is not a substitute for direct legal advice
              for your specific situation.
            </Trans>
          </em>
        </strong>
      </p>
      {isInLosAngeles && (
        <p>
          <strong>
            <em>
              <Trans>
                If you have received a Notice to Pay Rent or Quit or any other
                type of eviction notice, sign up for a workshop and/or get legal
                help at{" "}
                <LocalizedOutboundLink
                  hrefs={{
                    en: "https://www.stayhousedla.org/",
                    es: "https://www.stayhousedla.org/es",
                  }}
                >
                  StayHousedLA.org
                </LocalizedOutboundLink>
                .
              </Trans>
            </em>
          </strong>
        </p>
      )}
    </>
  </>
);

export const NorentLetterEmailToUserBody: React.FC<{}> = () => {
  const { session, server } = useContext(AppContext);
  const letter = session.norentLatestLetter;
  const faqURL = `${server.originURL}${NorentRoutes.locale.faqs}`;
  const onb = assertNotNull(session.onboardingInfo);
  const isInCA = onb.state === "CA";

  return (
    <>
      <Trans>
        <p>Hello {session.firstName},</p>
        <p>
          You've sent your NoRent letter. Attached to this email is a PDF copy
          for your records.
        </p>
      </Trans>
      {letter?.trackingNumber && (
        <p>
          <Trans>
            You can also track the delivery of your letter using USPS Tracking:
          </Trans>{" "}
          <a
            data-jf-show-href-only-in-plaintext
            href={USPS_TRACKING_URL_PREFIX + letter.trackingNumber}
          >
            {letter.trackingNumber}
          </a>
        </p>
      )}
      {isInCA ? (
        <CaliforniaContent isInLosAngeles={!!onb.isInLosAngeles} />
      ) : (
        <p>
          <Trans>
            To learn more about what to do next, check out our FAQ page:{" "}
            {faqURL}
          </Trans>
        </p>
      )}
    </>
  );
};

export const NorentLetterEmailToUserStaticPage = asEmailStaticPage((props) => (
  <HtmlEmail subject={li18n._(t`Your NoRent letter and important next steps`)}>
    <NorentLetterEmailToUserBody />
  </HtmlEmail>
));
