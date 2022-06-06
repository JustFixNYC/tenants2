import React, { DetailedHTMLProps, useState } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { friendlyPhoneNumber } from "../util/util";
import { getAbsoluteStaticURL } from "../app-context";
import {
  BoroughChoice,
  BoroughChoices,
  getBoroughChoiceLabels,
  isBoroughChoice,
} from "../../../common-data/borough-choices";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { TransformSession } from "../util/transform-session";
import Page from "../ui/page";
import { Form } from "../forms/form";
import { SelectFormField } from "../forms/form-fields";
import { toDjangoChoices } from "../common-data";
import {
  YesNoRadiosFormField,
  YesNoChoice,
  isYesNoChoice,
} from "../forms/yes-no-radios-form-field";
import { useLocation, useHistory, Link } from "react-router-dom";
import { QuerystringConverter } from "../networking/http-get-query-util";
import { NoScriptFallback } from "../ui/progressive-enhancement";
import {
  InputValidator,
  validateInput,
  asUnvalidatedInput,
} from "../forms/client-side-validation";
import JustfixRoutes from "../justfix-route-info";

const EXTRA_CSS = require("./service-instructions-email.css");

const NYCHA_SERVICE_EMAIL = "serviceECF@nycha.nyc.gov";

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
  Repairs = "R",
  Harassment = "H",
  Combined = "C",
}

type CaseTypeMap<T> = { [k in CaseType]: T };

const WHO_TO_SERVE_EXAMPLE_IMG_SRC: CaseTypeMap<string> = {
  [CaseType.Repairs]: "who-to-serve-repairs-only.jpg",
  [CaseType.Harassment]: "who-to-serve-harassment-only.jpg",
  [CaseType.Combined]: "who-to-serve-repairs-and-harassment.jpg",
};

const CASE_TYPE_NAMES: CaseTypeMap<string> = {
  [CaseType.Repairs]: "Repairs",
  [CaseType.Harassment]: "Harassment",
  [CaseType.Combined]: "Repairs and Harassment",
};

const VERIFIED_PETITION_PAGES: CaseTypeMap<string> = {
  [CaseType.Repairs]: "the page with the number “2” at the top right",
  [CaseType.Harassment]:
    "the pages with the numbers “2” and “3” at the top right",
  [CaseType.Combined]:
    "the pages with the numbers “2”, “3”, and “4” at the top right",
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

  /**
   * Whether this is being presented as a user-facing web page,
   * rather than as an email.
   */
  isWebPage?: boolean;

  /** The tenant's first name. */
  firstName: string;

  /** The borough of the tenant's court. */
  borough: BoroughChoice;

  /** Whether or not the tenant is serving NYCHA. */
  isNycha: boolean;
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

const OSC: React.FC<{}> = () => (
  <>“Order to Show Cause” (the page with the number “1” at the top right)</>
);

const VerifiedPetition: React.FC<CaseTypeProps> = (props) => (
  <>“Verified Petition” ({VERIFIED_PETITION_PAGES[toCaseType(props)]})</>
);

const ServiceInstructionsHeader: React.FC<ServiceInstructionsProps> = (props) =>
  props.isWebPage ? (
    <>
      <p>
        Follow these instructions to serve your HP Action papers on your
        landlord and/or management company. They will guide you through the
        process starting from the moment you submitted your HP Action through
        JustFix.
      </p>
      <p>PLEASE MAKE SURE TO READ THIS ENTIRE PAGE.</p>
      <hr />
      <h2>Follow these steps</h2>
    </>
  ) : (
    <>
      {props.isExample && (
        <Important>
          <strong>NOTE:</strong> This document is for example purposes only.
        </Important>
      )}
      <p>Hello {props.firstName},</p>
      <p>
        This is JustFix following up with some{" "}
        <strong>next steps and instructions</strong> now that you’ve filed an
        “HP Action” case in Housing Court for{" "}
        {CASE_TYPE_NAMES[toCaseType(props)]}.
      </p>
      <p>PLEASE MAKE SURE TO READ THIS ENTIRE EMAIL.</p>
      <h2>Next steps</h2>
    </>
  );

const ServiceInstructionsFooter: React.FC<ServiceInstructionsProps> = (props) =>
  props.isWebPage ? (
    <>
      <hr />
      <p>
        If you have any further questions, please feel free to email{" "}
        <EmailLink to={"documents@justfix.nyc"} /> explaining your concerns and
        we will be in touch to help.
      </p>
      <p>
        <strong>The JustFix Team</strong>
      </p>
    </>
  ) : (
    <>
      <p>
        If you have any further questions, please feel free to respond to this
        email and we will be in touch to help.
      </p>
      <p>Kind regards,</p>
      <p>The JustFix Team</p>
    </>
  );

export const ServiceInstructionsContent: React.FC<ServiceInstructionsProps> = (
  props
) => (
  <>
    <ServiceInstructionsHeader {...props} />
    <p>
      At this point, the paperwork that you signed and filed electronically has
      been sent to your borough’s Housing Court Clerk for review. This is what
      will happen next and what you need to do to make sure the process goes
      smoothly.
    </p>
    <ol>
      <li>
        <strong>Receiving the Judge’s decision</strong>
        <p>
          The Clerk will present your paperwork to the Judge and the Judge will
          decide whether or not to accept your case.
        </p>
        <ol type="a">
          <li>
            <strong>If the Judge does NOT accept your case</strong>, your case
            will be rejected, and you will get an email from the Clerk with the
            rejected paperwork as an attachment. You will see that the paperwork
            has not been signed by the Judge and may say “Rejected” on the
            bottom right of the page called <OSC />. On rare occasions, the
            Judge may have written an explanation on the documents as to why
            your case was rejected, or to tell you that you should file a
            different type of case.
          </li>
          <li>
            <strong>If the Judge accepts your case</strong>, you will get an
            email from the Clerk with an attachment. That attachment is the
            accepted paperwork. It will be signed by the Judge and may say
            “Accepted” on the bottom right of the page called <OSC />. It
            contains a lot of valuable information. Make sure to read it in
            full, especially the page called <OSC />. The most important piece
            of information is how to tell your landlord and/or management
            company that you are suing them. This is called “Service” and it is
            your responsibility.
          </li>
        </ol>
      </li>
      <li>
        <strong>
          Serving the paperwork on your landlord and/or management company
        </strong>
        <p>
          If your case was accepted, now you have to “serve” the papers on your
          landlord and/or management company. This means that you have to give
          your landlord or management company a copy of (some) of the papers in
          the attachment you got from the Clerk. Although we wish we could
          automate this part of the process for you, given the current legal
          structure, you have to do it yourself.{" "}
          {props.isNycha ? (
            <>
              Since you are in NYCHA housing, you will be serving your landlord
              through email.
            </>
          ) : (
            <>
              If two or more addresses are listed, you must serve copies of the
              paperwork to each address. You will have to print the pages that
              you have to serve. If you don’t have a printer, you can go to your
              local library, elected official’s office or your nearest print
              shop.
            </>
          )}
        </p>
        <Important>
          This step is very important because if you don’t serve the papers in
          exactly the way that the Judge ordered and by the deadline assigned,
          your case will be considered invalid and you will have to start all
          over again. (The deadline to serve could be very tight, sometimes less
          than 24 hours, so please be aware of doing this quickly.)
        </Important>
        <p>
          <em>See more details on how to serve below.</em>
        </p>
      </li>
      <li>
        <strong>Possible attorney assignment</strong>
        <p>
          Your case might be considered an emergency by the Judge. If so, you
          will be contacted by a lawyer. If your case is not considered an
          emergency, you will need to do everything yourself. (This is called
          being “pro-se”.) If you do not hear from a lawyer within a few days,
          you should assume that you will need to do things on your own.
        </p>
        <Important>
          Regardless of whether or not you hear from a lawyer, YOU must serve
          the paperwork on your landlord and/or management company. The lawyer
          will not do this on your behalf. There are instructions on how to
          serve below.
        </Important>
      </li>
      <li>
        <strong>Requesting a Virtual Hearing for your court date</strong>
        <p>
          You will have a court date assigned to you, which is listed on the{" "}
          <OSC /> but remember that you DO NOT have to go to the courthouse
          in-person right now. Instead, your court hearing can be done virtually
          through the internet using Skype.
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
            give it to the court so the court knows if there are in fact
            violations in your home.
          </p>
          <Important>
            The date and time scheduled for your inspection is written at the
            bottom of the "Tenant's Request for Inspection" (the page with the
            number "3" at the top right). On the day of your inspection, make
            sure to follow sanitation and social distancing measures as much as
            you can.
          </Important>
        </li>
      )}
    </ol>
    <h2>Serving the papers</h2>
    <p>This section includes instructions for:</p>
    <p>
      A. When to serve
      <br />
      B. Who to serve
      <br />
      C. What to serve
      <br />
      D. How to serve
    </p>
    <p>
      You will find all of the information you need to know (when, to whom,
      what, and how) in order to serve your paperwork on your landlord and/or
      management company on the page called <OSC />. It is in the section below
      where your court date is listed.
    </p>
    <ExampleImage
      src="osc-callout.jpg"
      alt="An Order to Show Cause (OSC) form"
      className="jf-has-border"
    />
    <h3>A. When to serve</h3>
    <p>
      You must serve your paperwork by the deadline set by the Judge on the page
      called <OSC />.{" "}
      {!props.isNycha && (
        <>
          Remember that most post offices close at 5pm Monday - Friday and 1pm
          on Saturdays.
        </>
      )}
    </p>
    <ExampleImage
      src="when-to-serve.jpg"
      alt="Close-up of OSC form identifying where information on when to serve is located"
      className="jf-has-border"
    />
    <h3>B. Who to serve</h3>
    {props.isNycha ? (
      <p>
        You will be serving NYCHA by email at{" "}
        <EmailLink to={NYCHA_SERVICE_EMAIL} />.
      </p>
    ) : (
      <>
        <p>
          If there are 2 people or companies listed on the paperwork you will
          need to serve them each separately. This could be because there is
          both a landlord and a management company in charge of your building.
        </p>
        <ExampleImage
          src={WHO_TO_SERVE_EXAMPLE_IMG_SRC[toCaseType(props)]}
          alt={`Close-up of form identifying where information on who to serve is located for ${
            CASE_TYPE_NAMES[toCaseType(props)]
          } cases`}
          preamble="You will find their address information here:"
          className="jf-has-border"
        />
      </>
    )}
    <h3>C. What to serve</h3>
    {props.isNycha ? (
      <p>
        You will be sending the entire PDF that was emailed to you by Housing
        Court.
      </p>
    ) : (
      <>
        <p>
          Since you are suing for {CASE_TYPE_NAMES[toCaseType(props)]}, the only
          pages you need to serve your landlord and/or management company are:
        </p>
        <ul>
          <li>
            The <OSC />
          </li>
          <li>
            The <VerifiedPetition {...props} />
          </li>
        </ul>
        <ExampleImage
          src="what-to-serve.jpg"
          alt="Close-up of OSC form identifying where information on what to serve is located"
          className="jf-has-border"
        />
        <p>
          Note that it is important NOT to send any other pieces of information
          that may contain sensitive details like your email address or
          financials. If you see any pages with that kind of info, please take
          them out and do not send them.
        </p>
      </>
    )}
    <h3>D. How to serve</h3>
    {props.isNycha ? (
      <p>
        Email the PDF to <EmailLink to={NYCHA_SERVICE_EMAIL} />.
      </p>
    ) : (
      <>
        <p>
          There are multiple ways to serve the papers and you have to do it
          exactly in the way that the Judge orders. You will find out what the
          Judge chose by looking at the page called <OSC />.
        </p>
        <ExampleImage
          src="how-to-serve.jpg"
          alt="Close-up of OSC form identifying where information on how to serve is located"
          className="jf-has-border"
          preamble="Note that the Judge might have typed-in or hand-written a different way than the standard shown here:"
        />
        <h4>The most likely way the Judge might ask you to serve</h4>
        <p>
          <strong>USPS Certified Mail, Return Receipt Requested</strong> is the
          most likely way the judge might ask you to serve. This will involve
          keeping two slips ready to show the Clerk on your court date,
          described below.
        </p>
        <h5>Certified mail receipt slip</h5>
        <p>
          The postal worker will give you a green slip as proof that you sent
          the paperwork by the right date. You can track the progress of the
          envelope by using the tracking number on the left of the slip. Keep it
          safe and be ready to show it to the Clerk on your court date.
        </p>
        <ExampleImage
          src="certified-mail-receipt.jpg"
          alt="Close-up of a USPS Certified Mail Receipt"
        />
        <h5>Return receipt requested slip</h5>
        <p>
          After the envelope reaches its destination, a green card will be
          mailed back to you at the address that you wrote in the “sender” box,
          which should be a mailbox that you have access to. Keep an eye out for
          it. Keep it safe and be ready to show it to the Clerk on your court
          date.
        </p>
        <ExampleImage
          src="domestic-return-receipt.jpg"
          alt="Close-up of a USPS Certified Mail Receipt"
        />
        <h5>Possible additional secondary methods</h5>
        <p>
          The Judge may require you to serve a second copy of the papers using
          another method to make sure that the landlord and/or management
          company receives them. If this is the case, the Judge will write this
          additional method on the <OSC />.
        </p>
        <p>Possible additional methods include:</p>
        <ul>
          <li>
            <strong>Regular first class mail</strong>
          </li>
          <li>
            <strong>Email</strong>
          </li>
          <li>
            <strong>First class mail with certificate of mailing</strong>
            <p>
              Using this method, the postal worker will give you a slip as proof
              that you sent the paperwork by the right date. Keep it safe and be
              ready to show it to the Clerk on your court date.
            </p>
          </li>
        </ul>
        <h4>Less likely ways the Judge might ask you to serve</h4>
        <ul>
          <li>
            <strong>USPS Priority mail/overnight mail</strong>
          </li>
          <li>
            <strong>Personally (in-person)</strong>
            <p>
              If this is the case, you or someone other than you who is over the
              age of 18 needs to hand-deliver the <OSC /> and{" "}
              <VerifiedPetition {...props} /> directly to each person or company
              you are suing. The person doing the service will need to fill out
              the "Affidavit of Service" at the end of the attachment and sign
              as the “Deponent”.
            </p>
          </li>
        </ul>
      </>
    )}
    <ServiceInstructionsFooter {...props} />
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
  const isNycha = s.onboardingInfo?.leaseType === "NYCHA";

  if (firstName && hpActionDetails && borough) {
    const { sueForHarassment, sueForRepairs } = hpActionDetails;
    if (
      typeof sueForHarassment == "boolean" &&
      typeof sueForRepairs === "boolean"
    ) {
      return { firstName, borough, sueForHarassment, sueForRepairs, isNycha };
    }
  }

  return null;
}

type ExampleServiceInstructionsInput = {
  borough: BoroughChoice;
  caseType: CaseType;
  isNycha: YesNoChoice;
};

function isCaseType(value: string): value is CaseType {
  return Object.keys(CASE_TYPE_NAMES).includes(value);
}

const exampleInputValidator: InputValidator<ExampleServiceInstructionsInput> = {
  borough: isBoroughChoice,
  caseType: isCaseType,
  isNycha: isYesNoChoice,
};

export const ExampleServiceInstructionsProps: ServiceInstructionsProps = {
  isExample: true,
  firstName: "JANE DOE",
  borough: "MANHATTAN",
  sueForHarassment: true,
  sueForRepairs: true,
  isNycha: false,
};

const SUBJECT =
  "Your HP Action case in Housing Court: Serving Instructions and Next Steps";

function formInputToInstructionsProps(
  input: ExampleServiceInstructionsInput
): ServiceInstructionsProps {
  const { borough, caseType, isNycha } = input;
  const sueForHarassment = [CaseType.Harassment, CaseType.Combined].includes(
    caseType
  );
  const sueForRepairs = [CaseType.Repairs, CaseType.Combined].includes(
    caseType
  );
  return {
    ...ExampleServiceInstructionsProps,
    borough,
    isNycha: isNycha === "True",
    sueForHarassment,
    sueForRepairs,
  };
}

const DEFAULT_INPUT: ExampleServiceInstructionsInput = {
  borough: "MANHATTAN",
  isNycha: "False",
  caseType: CaseType.Combined,
};

const ServiceInstructionsForm: React.FC<{
  children: (input: ServiceInstructionsProps) => JSX.Element;
}> = (props) => {
  const location = useLocation();
  const history = useHistory();
  const qs = new QuerystringConverter(
    location.search,
    asUnvalidatedInput(DEFAULT_INPUT)
  );
  const initialState = qs.toFormInput();
  const [latestInput, setLatestInput] = useState(initialState);
  const onChange = (input: typeof initialState) => {
    qs.maybePushToHistory(input, { location, history });
    setLatestInput(input);
  };
  const validatedInput = validateInput(latestInput, exampleInputValidator);

  return (
    <>
      <Form
        onSubmit={onChange}
        onChange={onChange}
        initialState={initialState}
        errors={validatedInput.errors}
        isLoading={false}
      >
        {(ctx) => {
          return (
            <>
              <SelectFormField
                {...ctx.fieldPropsFor("borough")}
                label="Borough"
                choices={toDjangoChoices(
                  BoroughChoices,
                  getBoroughChoiceLabels()
                )}
              />
              <SelectFormField
                {...ctx.fieldPropsFor("caseType")}
                label="Case type"
                choices={toDjangoChoices(
                  Object.keys(CASE_TYPE_NAMES),
                  CASE_TYPE_NAMES
                )}
              />
              <YesNoRadiosFormField
                {...ctx.fieldPropsFor("isNycha")}
                label="Are you in NYCHA housing?"
              />
              <NoScriptFallback>
                <button type="submit" className="button is-primary">
                  Show
                </button>
              </NoScriptFallback>
            </>
          );
        }}
      </Form>
      {!validatedInput.errors && (
        <div key={location.search} className="jf-fadein-half-second">
          {props.children(formInputToInstructionsProps(validatedInput.result))}
        </div>
      )}
    </>
  );
};

export const ExampleServiceInstructionsEmailForm: React.FC<{}> = (props) => {
  const location = useLocation();
  const emailPreview = JustfixRoutes.locale.ehp.exampleServiceInstructionsEmail;
  const { serviceInstructionsWebpage } = JustfixRoutes.locale.ehp;

  return (
    <Page
      title="Example service instructions email"
      withHeading
      className="content"
    >
      <ServiceInstructionsForm>
        {(props) => (
          <>
            <br />
            <p>
              The following content is a preview of instructions sent for
              serving Emergency HP Actions based on the above options.
            </p>
            <p>
              For a more accurate representation of how users will see it, you
              can view it as an{" "}
              <a href={`${emailPreview.html}?${location.search}`}>HTML email</a>{" "}
              and{" "}
              <a href={`${emailPreview.txt}?${location.search}`}>
                plaintext email
              </a>
              .
            </p>
            <p>
              If you'd like to see a version of this page that's more suitable
              for end-users, try{" "}
              <Link to={serviceInstructionsWebpage + location.search}>
                {serviceInstructionsWebpage}
              </Link>
              .
            </p>
            <hr />
            <ServiceInstructionsContent {...props} />
          </>
        )}
      </ServiceInstructionsForm>
    </Page>
  );
};

export const ServiceInstructionsWebpage: React.FC<{}> = (props) => {
  return (
    <Page
      title="How to serve your HP action papers"
      withHeading
      className="content"
    >
      <ServiceInstructionsForm>
        {(props) => (
          <>
            <hr />
            <ServiceInstructionsContent {...props} isWebPage />
          </>
        )}
      </ServiceInstructionsForm>
    </Page>
  );
};

export const ExampleServiceInstructionsEmail = asEmailStaticPage(() => {
  const location = useLocation();
  const qs = new QuerystringConverter(
    location.search,
    asUnvalidatedInput(DEFAULT_INPUT)
  );
  const exampleProps = formInputToInstructionsProps({
    ...DEFAULT_INPUT,
    ...validateInput(qs.toFormInput(), exampleInputValidator).result,
  });

  return (
    <HtmlEmail subject={`${SUBJECT} (EXAMPLE)`} extraCss={[EXTRA_CSS]}>
      <ServiceInstructionsContent {...exampleProps} />
    </HtmlEmail>
  );
});

export const ServiceInstructionsEmail = asEmailStaticPage(() => (
  <TransformSession transformer={getServiceInstructionsPropsFromSession}>
    {(props) => (
      <HtmlEmail subject={SUBJECT} extraCss={[EXTRA_CSS]}>
        <ServiceInstructionsContent {...props} />
      </HtmlEmail>
    )}
  </TransformSession>
));
