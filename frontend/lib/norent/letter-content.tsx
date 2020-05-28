import React, { useContext } from "react";
import { QueryLoader } from "../networking/query-loader";
import { NorentLetterContentQuery } from "../queries/NorentLetterContentQuery";
import { LetterStaticPage } from "../static-page/letter-static-page";
import { AppContext } from "../app-context";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { assertNotNull } from "../util/util";
import { friendlyDate } from "../util/date-util";
import { formatPhoneNumber } from "../forms/phone-number-form-field";
import {
  EmailSubject,
  asEmailStaticPage,
} from "../static-page/email-static-page";
import {
  USStateChoice,
  getUSStateChoiceLabels,
} from "../../../common-data/us-state-choices";
import {
  getNorentMetadataForUSState,
  CovidStateLawVersion,
} from "./letter-builder/national-metadata";
import { BreaksBetweenLines } from "../ui/breaks-between-lines";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

export type NorentLetterContentProps = {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  aptNumber: string;
  email: string;
  phoneNumber: string;
  landlordName: string;
  landlordAddress: string;
  landlordEmail: string;
  paymentDate: GraphQLDate;
  todaysDate?: GraphQLDate;
};

type StringHelper = (props: NorentLetterContentProps) => string;

/**
 * Some of our helper functions that build strings out of our props
 * are slightly easier to read as components, so this function
 * just converts a helper to a component.
 */
function componentizeHelper(
  fn: StringHelper
): React.FC<NorentLetterContentProps> {
  return (props) => <>{fn(props)}</>;
}

const LandlordName = componentizeHelper((props) =>
  props.landlordName.toUpperCase()
);

const getFullName: StringHelper = (props) =>
  `${props.firstName} ${props.lastName}`;

const FullName = componentizeHelper(getFullName);

export const getStreetWithApt = ({
  street,
  aptNumber,
}: Pick<NorentLetterContentProps, "street" | "aptNumber">) => {
  if (!aptNumber) return street;
  return `${street} #${aptNumber}`;
};

const AddressLine = componentizeHelper(
  (props) =>
    `${getStreetWithApt(props)}, ${props.city}, ${props.state} ${props.zipCode}`
);

/** An annoying workaround for both WeasyPrint and Lingui. */
const Newline: React.FC<{}> = () => <>{"\n"}</>;

const LetterTitle: React.FC<NorentLetterContentProps> = (props) => (
  /*
   * We originally had a <br> in this <h1>, but React self-closes the
   * tag as <br/>, which WeasyPrint doesn't seem to like, so we'll
   * include an actual newline and set the style to preserve whitespace.
   */
  <h1 className="has-text-right" style={{ whiteSpace: "pre-wrap" }}>
    <Trans>
      <span className="is-uppercase">Notice of COVID-19 impact on rent</span>
      <Newline />
      at <AddressLine {...props} />
    </Trans>
  </h1>
);

// Oy, server dates are in midnight UTC time, and we explicitly want
// to *not* convert it to any other time zone, otherwise it may
// appear as a different date.
function friendlyUTCDate(date: GraphQLDate) {
  return friendlyDate(new Date(date), "UTC");
}

const PaymentDate = componentizeHelper((props) =>
  friendlyUTCDate(props.paymentDate)
);

/**
 * The to/from address of the letter.
 *
 * Note that this isn't internationalized because we don't actually
 * show it to the user in their locale.
 */
const LetterHeading: React.FC<NorentLetterContentProps> = (props) => (
  <dl className="jf-letter-heading">
    <dt>To</dt>
    <dd>
      <LandlordName {...props} />
      <br />
      {props.landlordAddress ? (
        <BreaksBetweenLines lines={props.landlordAddress} />
      ) : (
        <>{props.landlordEmail}</>
      )}
    </dd>
    <dt>From</dt>
    <dd>
      <FullName {...props} />
      <br />
      {getStreetWithApt(props)}
      <br />
      {props.city}, {props.state} {props.zipCode}
      <br />
      {formatPhoneNumber(props.phoneNumber)}
    </dd>
  </dl>
);

const TenantProtections: React.FC<NorentLetterContentProps> = (props) => {
  const state = props.state as USStateChoice;
  const protectionData = getNorentMetadataForUSState(state)?.lawForLetter;

  return (
    <>
      <p>
        <Trans>
          Tenants impacted by the COVID-19 crisis are protected from eviction
          for nonpayment per emergency declaration(s) from:
        </Trans>
      </p>
      <ul>
        {protectionData &&
          protectionData.textOfLegislation.map((protection, i) => (
            <li key={i}>{protection}</li>
          ))}
      </ul>
    </>
  );
};

const LetterContentPropsFromSession: React.FC<{
  children: (lcProps: NorentLetterContentProps) => JSX.Element;
}> = ({ children }) => {
  const { session } = useContext(AppContext);
  const lcProps = getNorentLetterContentPropsFromSession(session);

  if (!lcProps) {
    return <p>We don't have enough information to generate a letter yet.</p>;
  }

  return children(lcProps);
};

const DearLandlord: React.FC<NorentLetterContentProps> = (props) => (
  <p>
    <Trans description="salutation of formal letter">
      Dear <LandlordName {...props} />,
    </Trans>
  </p>
);

const Regards: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <p className="jf-signature">
    <Trans description="before signature in formal letter">Regards,</Trans>
    {children}
  </p>
);

export const NorentLetterEmailToLandlord: React.FC<NorentLetterContentProps> = (
  props
) => (
  <>
    <EmailSubject
      value={li18n._(
        t`Notice of COVID-19 impact on Rent sent on behalf of ${getFullName(
          props
        )}`
      )}
    />
    <DearLandlord {...props} />
    <Trans id="norent.emailToLandlordBody">
      <p>
        Please see letter attached from <FullName {...props} />.{" "}
      </p>
      <p>
        In order to document communications and avoid misunderstandings, please
        correspond with <FullName {...props} /> via mail or text rather than a
        phone call or in-person visit.
      </p>
    </Trans>
    <Regards />
    <p>
      <Trans>
        JustFix.nyc <br />
        sent on behalf of <FullName {...props} />
      </Trans>
    </p>
  </>
);

export const NorentLetterEmailToLandlordForUser: React.FC<{}> = () => (
  <LetterContentPropsFromSession
    children={(lcProps) => <NorentLetterEmailToLandlord {...lcProps} />}
  />
);

export const NorentLetterEmailToLandlordForUserStaticPage = asEmailStaticPage(
  NorentLetterEmailToLandlordForUser
);

export const NorentLetterContent: React.FC<NorentLetterContentProps> = (
  props
) => {
  const state = props.state as USStateChoice;
  const letterVersion = getNorentMetadataForUSState(state).lawForLetter
    .whichVersion;
  const todaysDate = props.todaysDate
    ? friendlyUTCDate(props.todaysDate)
    : friendlyDate(new Date());
  return (
    <>
      <LetterTitle {...props} />
      <p className="has-text-right">{todaysDate}</p>
      <LetterHeading {...props} />
      <DearLandlord {...props} />
      {letterVersion === CovidStateLawVersion.V1_NON_PAYMENT ? (
        <p>
          <Trans id="norent.letter.v1NonPayment">
            This letter is to notify you that I will be unable to pay rent
            starting on <PaymentDate {...props} /> and until further notice due
            to loss of income, increased expenses, and/or other financial
            circumstances related to COVID-19.
          </Trans>
        </p>
      ) : letterVersion === CovidStateLawVersion.V2_HARDSHIP ? (
        <p>
          <Trans id="norent.letter.v2Hardship">
            This letter is to notify you that I have experienced a loss of
            income, increased expenses and/or other financial circumstances
            related to the pandemic. Until further notice, the COVID-19
            emergency may impact my ability to pay rent. I am not waiving my
            right to assert any other defenses.
          </Trans>
        </p>
      ) : (
        // Letter Copy for V3_FEW_PROTECTIONS, the default:
        <p>
          <Trans id="norent.letter.v3FewProtections">
            This letter is to advise you of protections in place for tenants in{" "}
            {getUSStateChoiceLabels()[state]}. I am not waiving my right to
            assert any other defenses.
          </Trans>
        </p>
      )}
      <TenantProtections {...props} />
      <Trans id="norent.letter.conclusion">
        <p>
          Congress passed the CARES Act on March 27, 2020 (Public Law 116-136).
          Tenants in covered properties are also protected from eviction for
          non-payment or any other reason until August 23, 2020. Tenants cannot
          be charged late fees, interest, or other penalties through July 25,
          2020. Please let me know right away if you believe this property is
          not covered by the CARES Act and explain why the property is not
          covered.
        </p>
        <p>
          In order to document our communication and to avoid misunderstandings,
          please reply to me via mail or text rather than a call or visit.
        </p>
        <p>Thank you for your understanding and cooperation.</p>
      </Trans>
      <Regards>
        <br />
        <br />
        <FullName {...props} />
      </Regards>
    </>
  );
};

const NorentLetterStaticPage: React.FC<
  { isPdf?: boolean; title: string } & NorentLetterContentProps
> = ({ isPdf, title, ...props }) => (
  <QueryLoader
    query={NorentLetterContentQuery}
    render={(output) => {
      return (
        <LetterStaticPage title={title} isPdf={isPdf} css={output.letterStyles}>
          <NorentLetterContent {...props} />
        </LetterStaticPage>
      );
    }}
    input={null}
    loading={() => null}
  />
);

function getNorentLetterContentPropsFromSession(
  session: AllSessionInfo
): NorentLetterContentProps | null {
  const onb = session.onboardingInfo;
  const ld = session.landlordDetails;
  if (!(ld && onb)) {
    return null;
  }

  const paymentDate = session.norentLatestRentPeriod?.paymentDate;

  if (!paymentDate) {
    console.log(
      "No latest rent period defined! Please create one in the admin."
    );
    return null;
  }

  const props: NorentLetterContentProps = {
    paymentDate,
    phoneNumber: assertNotNull(session.phoneNumber),
    firstName: assertNotNull(session.firstName),
    lastName: assertNotNull(session.lastName),
    email: assertNotNull(session.email),
    street: onb.address,
    city: onb.city,
    state: onb.state,
    zipCode: onb.zipcode,
    aptNumber: onb.aptNumber,
    landlordName: ld.name,
    landlordAddress: ld.address,
    landlordEmail: ld.email,
  };

  return props;
}

export const NorentLetterForUserStaticPage: React.FC<{ isPdf?: boolean }> = ({
  isPdf,
}) => (
  <LetterContentPropsFromSession
    children={(lcProps) => (
      <NorentLetterStaticPage
        {...lcProps}
        isPdf={isPdf}
        title={li18n._(t`Your NoRent.org letter`)}
      />
    )}
  />
);

export const noRentSampleLetterProps: NorentLetterContentProps = {
  firstName: "Boop",
  lastName: "Jones",
  street: "654 Park Place",
  city: "Brooklyn",
  state: "NY",
  zipCode: "12345",
  aptNumber: "2",
  email: "boop@jones.com",
  phoneNumber: "5551234567",
  landlordName: "Landlordo Calrissian",
  landlordAddress: "1 Cloud City Drive\nBespin, OH 41235",
  landlordEmail: "landlordo@calrissian.net",
  paymentDate: "2020-05-01T15:41:37.114Z",
};

export const NorentSampleLetterSamplePage: React.FC<{ isPdf?: boolean }> = ({
  isPdf,
}) => {
  const { session } = useContext(AppContext);
  const props: NorentLetterContentProps = {
    ...noRentSampleLetterProps,
    paymentDate:
      session.norentLatestRentPeriod?.paymentDate ||
      noRentSampleLetterProps.paymentDate,
  };
  return (
    <NorentLetterStaticPage
      {...props}
      title={li18n._(t`Sample NoRent.org letter`)}
      isPdf={isPdf}
    />
  );
};
