import React, { DetailedHTMLProps } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { friendlyPhoneNumber } from "../util/util";
import { getAbsoluteStaticURL } from "../app-context";

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
  /** The tenant's first name. */
  firstName: string;

  /** The email address of the tenant's court. */
  courtEmail: string;

  /** The 10-digit phone number of the tenant's court. */
  courtPhoneNumber: string;
};

const ServiceInstructionsContent: React.FC<ServiceInstructionsProps> = (
  props
) => (
  <>
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
        <ul>
          <li>
            <strong>Your Borough office's email:</strong>{" "}
            <EmailLink to={props.courtEmail} />
          </li>
          <li>
            <strong>Your Borough office's phone number:</strong>{" "}
            <TelLink to={props.courtPhoneNumber} />
          </li>
        </ul>
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
    {/* TODO: FINISH THIS. */}
  </>
);

type ExampleImageProps = {
  src: string;
  alt: string;
} & DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

const ExampleImage: React.FC<ExampleImageProps> = ({ src, ...props }) => (
  <>
    <p>Here's an example:</p>
    <p>
      <img
        src={`${getAbsoluteStaticURL()}hpaction/service-instructions/${src}`}
        {...props}
      />
    </p>
  </>
);

export const ServiceInstructionsEmail = asEmailStaticPage(() => (
  <HtmlEmail subject="HP Action: service instructions confirmation email">
    <ServiceInstructionsContent
      firstName="Boop"
      courtEmail="bronx@nycourts.gov"
      courtPhoneNumber="5551234567"
      sueForHarassment
      sueForRepairs
    />
  </HtmlEmail>
));
