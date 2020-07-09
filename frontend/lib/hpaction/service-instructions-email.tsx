import React, { DetailedHTMLProps } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { friendlyPhoneNumber } from "../util/util";
import { getAbsoluteStaticURL } from "../app-context";
import { BoroughChoice } from "../../../common-data/borough-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { TransformSession } from "../util/transform-session";

const EXTRA_CSS = require("./service-instructions-email.css");

// TODO: Figure out how many days this is.
const LAWYER_RESPONSE_MAX_DAYS = "(X)";

const EmailLink: React.FC<{ to: string }> = ({ to }) => (
  <a href={`mailto:${to}`}>{to}</a>
);

const TelLink: React.FC<{ to: string }> = ({ to }) => (
  <a href={`tel:+1${to}`}>{friendlyPhoneNumber(to)}</a>
);

const Important: React.FC<{ children: React.ReactNode }> = (props) => (
  <p className="has-text-danger">{props.children}</p>
);

type CaseTypeProps = {
  /** Whether the tenant is suing for repairs. */
  sueForRepairs: boolean;

  /** Whether the tenant is suing for harassment. */
  sueForHarassment: boolean;
};

enum CaseType {
  Repairs,
  Harassment,
  Combined,
}

const CASE_TYPE_NAMES: { [k in CaseType]: string } = {
  [CaseType.Repairs]: "Repairs",
  [CaseType.Harassment]: "Harassment",
  [CaseType.Combined]: "Repairs and Harassment",
};

const WHAT_TO_SERVE: { [k in CaseType]: string } = {
  [CaseType.Repairs]:
    "Order to Show Cause + Verified Petition (2 pages in total)",
  [CaseType.Harassment]:
    "Order to Show Cause + Verified Petition (3 pages in total)",
  [CaseType.Combined]:
    "Order to Show Cause + Verified Petition (4 pages in total)",
};

function toCaseType({
  sueForHarassment,
  sueForRepairs,
}: CaseTypeProps): CaseType {
  if (sueForHarassment && sueForRepairs) return CaseType.Combined;
  if (sueForHarassment) return CaseType.Harassment;
  return CaseType.Repairs;
}

type ServiceInstructionsProps = CaseTypeProps & {
  /**
   * Whether this is an example and doesn't represent real instructions for
   * an actual person.
   */
  isExample?: boolean;

  /** The tenant's first name. */
  firstName: string;

  /** The borough of the tenant's court. */
  borough: BoroughChoice;
};

type CourtInfo = { email: string; phone: string };

const COURT_INFO: { [k in BoroughChoice]: CourtInfo } = {
  BRONX: {
    email: "civbxhs-skype-vc@nycourts.gov",
    phone: "7184663000",
  },
  BROOKLYN: {
    email: "civkin-skype-vc@nycourts.gov",
    phone: "3474049133",
  },
  MANHATTAN: {
    email: "civnyc-skype-vc@nycourts.gov",
    phone: "6463865730",
  },
  QUEENS: {
    email: "civqns-skype-vc@nycourts.gov",
    phone: "7182627300",
  },
  STATEN_ISLAND: {
    email: "civric-skype-vc@nycourts.gov",
    phone: "3473784143",
  },
};

const CourtContactInfo: React.FC<{ borough: BoroughChoice }> = (props) => {
  const info = COURT_INFO[props.borough];

  return (
    <ul>
      <li>
        <strong>Your Borough office's email:</strong>{" "}
        <EmailLink to={info.email} />
      </li>
      <li>
        <strong>Your Borough office's phone number:</strong>{" "}
        <TelLink to={info.phone} />
      </li>
    </ul>
  );
};

export const ServiceInstructionsContent: React.FC<ServiceInstructionsProps> = (
  props
) => (
  <>
    {props.isExample && (
      <Important>
        <strong>NOTE:</strong> This document is for example purposes only.
      </Important>
    )}
    <p>Hello {props.firstName},</p>
    <p>
      This is JustFix.nyc following up with some{" "}
      <strong>next steps and instructions</strong> now that you’ve filed an “HP
      Action” case in Housing Court for {CASE_TYPE_NAMES[toCaseType(props)]}.
    </p>
    <h2>Next steps</h2>
    <p>
      At this point, your signed paperwork has been sent to your borough’s
      Housing Court Clerk for review. This is what will happen next and what you
      need to do to make sure the process goes smoothly.
    </p>
    <ol>
      <li>
        <strong>Judge’s decision</strong>
        <p>
          The Clerk will present your paperwork to the Judge and the Judge will
          decide whether or not to accept your case.
        </p>
        <ol type="a">
          <li>
            <strong>If the Judge does NOT accept your case</strong>, your case
            will be rejected and you will get an email from the Clerk letting
            you know with an attachment, which is the rejected paperwork. On
            rare occasions, the Judge may have written on the documents to
            explain why your case was rejected or to tell you that you should
            file a different type of case.
          </li>
          <li>
            <strong>If the Judge accepts your case</strong>, you will get an
            email from the Clerk with an attachment. That attachment is the
            paperwork signed by the Judge. It contains a lot of valuable
            information. The most important piece of information is how to tell
            your landlord and/or management company that you are suing them.
            This is called “Service”.
          </li>
        </ol>
      </li>
      <li>
        <strong>Serving the papers</strong>
        <p>
          If your case was accepted, now you have to “serve” the papers on your
          landlord and/or management company. This means that you have to give
          your landlord or management company a copy of (some) of the papers in
          the attachment you got from the Clerk. If two addresses are listed you
          must serve both. You will have to print the pages that you have to
          serve. If you don’t have a printer, you can go to your local library
          or your nearest print shop.
        </p>
        <Important>
          This step is very important because if you don’t serve the papers in
          exactly the way that the Judge ordered and by the deadline, your case
          will be considered invalid and you will have to start all over again.
          (The deadline to serve could be very tight, sometimes less than 24
          hours, so please be aware of doing this quickly.)
        </Important>
        <p>
          <em>See more details on how to serve below.</em>
        </p>
      </li>
      <li>
        <strong>Possible attorney assignment</strong>
        <p>
          Your case might be considered an emergency by the Judge. If so, you
          will be contacted by a lawyer who will help you with your case. If
          not, you will need to do everything yourself. (This is called
          appearing “pro-se”.) If you do not hear from a lawyer within{" "}
          {LAWYER_RESPONSE_MAX_DAYS} days, you should assume that you will need
          to be pro-se.
        </p>
        <Important>
          Regardless of whether or not you hear from a lawyer YOU must serve the
          paperwork on your landlord and/or management company. The lawyer will
          not do this on your behalf. There are instructions on how to serve
          following this list.
        </Important>
      </li>
      <li>
        <strong>Requesting a Virtual Hearing for your court date</strong>
        <p>
          You will have a court date assigned to you but remember that you DO
          NOT have to go to the courthouse in-person right now. Instead, your
          court hearing can be done virtually through the internet using Skype.
        </p>
        <p>
          To request the instructions to have a virtual hearing email or call
          your Borough’s office. Make sure to include your name and Index Number
          (found at the top right of your HP Action paperwork).
        </p>
        <CourtContactInfo borough={props.borough} />
      </li>
      {props.sueForRepairs && (
        <li>
          <strong>HPD inspection</strong>
          <p>
            Since you filed for repairs, an inspector from HPD (the Department
            of Housing Preservation and Development) will come to inspect the
            conditions in your home to see if they are violations of the law
            called the Housing Maintenance Code. They will make a report and
            give it to the court so the court knows what’s going on in your
            home.
          </p>
          <Important>
            A representative from HPD will call you to arrange the time and date
            of the inspection. On the day of your inspection, make sure to
            follow sanitation and social distancing measures as much as you can.
          </Important>
        </li>
      )}
    </ol>
    <h2>Serving the papers</h2>
    <p>
      You will find all of the information you need to know (when, what, how,
      and to whom) in order to serve your paperwork on your landlord and/or
      management company on the page called “Order to Show Cause”, which is the
      one with the Judge’s signature. It is in the section below where your
      court date is listed.
    </p>
    <ExampleImage
      src="osc-callout.jpg"
      alt="An Order to Show Cause (OSC) form"
      className="jf-has-border"
    />
    <h3>When to serve</h3>
    <p>
      You must serve your paperwork by the deadline set by the Judge on the page
      called “Order to Show Cause”, which is the page with the Judge’s
      signature. Remember that most post offices close at 5pm Monday - Friday
      and 1pm on Saturdays.
    </p>
    <ExampleImage
      src="when-to-serve.jpg"
      alt="Close-up of OSC form identifying where information on when to serve is located"
      className="jf-has-border"
    />
    <h3>What to serve</h3>
    <p>
      Since you are suing for {CASE_TYPE_NAMES[toCaseType(props)]}, the only
      pages you need to serve your landlord and/or management company are the{" "}
      <strong>{WHAT_TO_SERVE[toCaseType(props)]}</strong>.
    </p>
    <ExampleImage
      src="what-to-serve.jpg"
      alt="Close-up of OSC form identifying where information on what to serve is located"
      className="jf-has-border"
    />
    <p>
      Note that it is important NOT to send any other pieces of information that
      may contain sensitive details like your email address or financials. If
      you see any papers in the paperwork with that kind of info, please take
      them out and do not send them.
    </p>
    <h3>How to serve</h3>
    <p>
      There are multiple ways to serve the papers and you have to do it exactly
      in the way that the Judge orders. You will find out what the Judge chose
      by looking at the page called “Order to Show Cause”, which is the page
      with the Judge’s signature.
    </p>
    <ExampleImage
      src="how-to-serve.jpg"
      alt="Close-up of OSC form identifying where information on how to serve is located"
      className="jf-has-border"
      preamble="Note that the Judge might have typed-in or hand-written a different way than the standard shown here:"
    />
    <p>Possible ways the Judge might ask you to serve:</p>
    <ul>
      <li>By email</li>
      <li>
        “Personally”, which means in-person.{" "}
        <span className="has-text-danger">
          If this is the case you will need to fill out the "Affidavit of
          Service" at the end of the attachment.
        </span>
      </li>
      <li>
        By USPS mail using the option that the Judge chose, which might be:
        <ul>
          <li>First Class Mail</li>
          <li>First Class Mail with certificate of mailing</li>
          <li>Priority Mail/Overnight Mail</li>
          <li>
            Certified Mail, Return Receipt Requested (this is the most common)
          </li>
        </ul>
      </li>
    </ul>
    <h4>Certified mail receipt slip</h4>
    <p>
      The postal worker will give you a green slip as proof that you sent the
      paperwork by the right date. You can track the progress of the envelope by
      using the tracking number on the left of the slip.
    </p>
    <ExampleImage
      src="certified-mail-receipt.jpg"
      alt="Close-up of a USPS Certified Mail Receipt"
    />
    <h4>Domestic return receipt requested card</h4>
    <p>
      After the envelope reaches its destination, a green card will get mailed
      back to you at the address that you wrote in the “sender” box, which
      should be a mailbox that you have access to. Keep an eye out for it.
    </p>
    <ExampleImage
      src="domestic-return-receipt.jpg"
      alt="Close-up of a USPS Certified Mail Receipt"
    />
    <h3>Who to serve</h3>
    <p>
      If there are 2 people or companies listed on the paperwork you will need
      to serve them both. This could be because there is a landlord and a
      management company.
    </p>
  </>
);

type ExampleImageProps = {
  preamble?: string;
  src: string;
  alt: string;
} & DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

const ExampleImage: React.FC<ExampleImageProps> = ({
  preamble,
  src,
  ...props
}) => (
  <>
    <p>{preamble || "Here's an example:"}</p>
    <p>
      <img
        src={`${getAbsoluteStaticURL()}hpaction/service-instructions/${src}`}
        {...props}
      />
    </p>
  </>
);

export function getServiceInstructionsPropsFromSession(
  s: AllSessionInfo
): ServiceInstructionsProps | null {
  const { firstName, hpActionDetails } = s;
  const borough = s.onboardingInfo?.borough;

  if (firstName && hpActionDetails && borough) {
    const { sueForHarassment, sueForRepairs } = hpActionDetails;
    if (
      typeof sueForHarassment == "boolean" &&
      typeof sueForRepairs === "boolean"
    ) {
      return { firstName, borough, sueForHarassment, sueForRepairs };
    }
  }

  return null;
}

export const ExampleServiceInstructionsProps: ServiceInstructionsProps = {
  isExample: true,
  firstName: "JANE DOE",
  borough: "MANHATTAN",
  sueForHarassment: true,
  sueForRepairs: true,
};

const SUBJECT =
  "Your HP Action case in Housing Court: Instructions and Next Steps";

export const ExampleServiceInstructionsEmail = asEmailStaticPage(() => (
  <HtmlEmail subject={`${SUBJECT} (EXAMPLE)`} extraCss={[EXTRA_CSS]}>
    <ServiceInstructionsContent {...ExampleServiceInstructionsProps} />
  </HtmlEmail>
));

export const ServiceInstructionsEmail = asEmailStaticPage(() => (
  <TransformSession transformer={getServiceInstructionsPropsFromSession}>
    {(props) => (
      <HtmlEmail subject={SUBJECT} extraCss={[EXTRA_CSS]}>
        <ServiceInstructionsContent {...props} />
      </HtmlEmail>
    )}
  </TransformSession>
));
