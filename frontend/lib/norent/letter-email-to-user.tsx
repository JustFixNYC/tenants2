import React from "react";

import { useContext } from "react";
import { AppContext } from "../app-context";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { NorentRoutes } from "./route-info";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc";
import { MessageDescriptor } from "@lingui/core";
import { LocalizedOutboundLink } from "../ui/localized-outbound-link";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import { AllSessionInfo } from "../queries/AllSessionInfo";

type CaliforniaFAQProps = {
  question: MessageDescriptor;
  locality?: "IN LA" | "OUTSIDE LA" | "ALL CALIFORNIA";
  answer: JSX.Element;
};

const CALIFORNIA_FAQS: CaliforniaFAQProps[] = [
  {
    question: t`What is the new law AB832?`,
    answer: (
      <>
        <p>
          <Trans id="norent.whatIsAB832partOne">
            [update] AB832 is now state law and extends tenant protection until
            September 30, 2021. The Act extends tenant protections included in
            the Tenant, Homeowner, and Small Landlord Relief and Stabilization
            Act of 2020 (AB3088) and SB91 to September 30, 2021. These
            protections were originally set to expire on June 30, 2021 under
            SB91. The Act includes the same eligibility and program rules as
            before including:
          </Trans>
        </p>
        <Trans id="norent.whatIsAB832partTwo">
          <ol>
            <li>
              Limiting public disclosure of eviction cases involving nonpayment
              of rent between March 4, 2020 and September 30, 2021.
            </li>
            <li>
              Protects low-income tenants from landlords assigning or selling
              their rental debt to a third-party debt collector.
            </li>
            <li>
              “Pay or Quit” Notice period for nonpayment of rent extended from 3
              to 15 days.
            </li>
            <li>
              Protects tenants from being evicted for “just cause” if landlord
              is shown to be really evicting the tenant for COVID-19 related
              nonpayment of rent.
            </li>
            <li>
              Landlord may not charge late fees for nonpayment of rent between
              March 1, 2020 and September 30, 2021 to tenants who have attested
              they are experiencing a COVID-19-related hardship.
            </li>
            <li>
              Require landlords to notify all tenants who owe back rent about
              the availability of their rights and the rental assistance program
              via an informational notice by February 28, 2021.
            </li>
          </ol>
        </Trans>
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
        <Trans id="norent.doINeedToSendAB832LetterEveryMonth">
          Yes. Follow these instructions even if you have sent a letter to your
          landlord each month that you have not paid. And send a new declaration
          for every month through September 2021.
        </Trans>
      </p>
    ),
  },
  {
    question: t`Do I still have to pay my rent?`,
    answer: (
      <p>
        <Trans id="norent.doIStillHaveToPayMyRentAB832">
          [change?] On or before 6/30/2021 you must decide whether to pay 25% of
          the rent for each month from September 2020 to September 2021. That’s
          13 months multiplied by 25%. If after consulting with an attorney, you
          determine that you do not want to be in eviction court, pay the 25%.
          Tenants with severely bad conditions or living in illegal units should
          talk with an attorney before deciding whether to pay.
        </Trans>
      </p>
    ),
  },
  {
    question: t`What if my landlord sends me a notice?`,
    answer: (
      <p>
        <Trans id="norent.whatIfMyLandlordSendsMeANoticeAB3088">
          If you have sent the declaration and the owner sends you a notice to
          pay rent with a declaration, read it, if it is the same as the one you
          have sent to them already, date, sign and send it exactly as
          instructed in the notice to pay rent or quit. Note that sometimes
          owners change the address or the way to pay when they send a notice to
          pay rent or quit. Follow the instructions in the notice to pay rent or
          quit.
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

type EmailBodyProps = {
  firstName: string;
  trackingNumber?: string;
  isInCA: boolean;
  isInLosAngeles: boolean;
  faqURL: string;
};

const EmailBody: React.FC<EmailBodyProps> = ({ faqURL, ...props }) => (
  <>
    <Trans>
      <p>Hello {props.firstName},</p>
      <p>
        You've sent your NoRent letter. Attached to this email is a PDF copy for
        your records.
      </p>
    </Trans>
    {props.trackingNumber && (
      <p>
        <Trans>
          You can also track the delivery of your letter using USPS Tracking:
        </Trans>{" "}
        <a
          data-jf-show-href-only-in-plaintext
          href={USPS_TRACKING_URL_PREFIX + props.trackingNumber}
        >
          {props.trackingNumber}
        </a>
      </p>
    )}
    {props.isInCA ? (
      <CaliforniaContent isInLosAngeles={props.isInLosAngeles} />
    ) : (
      <p>
        <Trans>
          To learn more about what to do next, check out our FAQ page: {faqURL}
        </Trans>
      </p>
    )}
  </>
);

export const NorentLetterEmailToUserBody: React.FC<{}> = () => {
  const { server } = useContext(AppContext);

  return (
    <TransformSession
      transformer={(session: AllSessionInfo): EmailBodyProps | null => {
        const { firstName, onboardingInfo } = session;
        if (!(onboardingInfo && firstName)) return null;
        return {
          trackingNumber: session.norentLatestLetter?.trackingNumber,
          isInLosAngeles: !!onboardingInfo.isInLosAngeles,
          isInCA: onboardingInfo.state === "CA",
          faqURL: `${server.originURL}${NorentRoutes.locale.faqs}`,
          firstName,
        };
      }}
    >
      {(bodyProps) => <EmailBody {...bodyProps} />}
    </TransformSession>
  );
};

export const NorentLetterEmailToUserStaticPage = asEmailStaticPage((props) => (
  <HtmlEmail subject={li18n._(t`Your NoRent letter and important next steps`)}>
    <NorentLetterEmailToUserBody />
  </HtmlEmail>
));
