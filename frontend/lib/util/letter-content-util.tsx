import React from "react";
import { BreaksBetweenLines } from "../ui/breaks-between-lines";
import { formatPhoneNumber } from "../forms/phone-number-form-field";
import { Trans } from "@lingui/macro";
import { friendlyUTCDate, friendlyDate } from "./date-util";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { assertNotNull } from "./util";
import { makeStringHelperFC } from "./string-helper";

export type BaseLetterContentProps = {
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
  todaysDate?: GraphQLDate;
};

const componentizeHelper = makeStringHelperFC<BaseLetterContentProps>();

const LandlordName = componentizeHelper((props) =>
  props.landlordName.toUpperCase()
);

const getFullName = (props: BaseLetterContentProps) =>
  `${props.firstName} ${props.lastName}`;

const FullName = componentizeHelper(getFullName);

const getTodaysDate = (props: BaseLetterContentProps) =>
  props.todaysDate
    ? friendlyUTCDate(props.todaysDate)
    : friendlyDate(new Date());

const TodaysDate: React.FC<BaseLetterContentProps> = (props) => (
  <p className="has-text-right">{getTodaysDate(props)}</p>
);

export const getStreetWithApt = ({
  street,
  aptNumber,
}: Pick<BaseLetterContentProps, "street" | "aptNumber">) => {
  if (!aptNumber) return street;
  return `${street} #${aptNumber}`;
};

const AddressLine = componentizeHelper(
  (props) =>
    `${getStreetWithApt(props)}, ${props.city}, ${props.state} ${props.zipCode}`
);

const LandlordAddress: React.FC<BaseLetterContentProps> = (props) => (
  <dd>
    <LandlordName {...props} />
    <br />
    {props.landlordAddress ? (
      <BreaksBetweenLines lines={props.landlordAddress} />
    ) : (
      <>{props.landlordEmail}</>
    )}
  </dd>
);

const Address: React.FC<BaseLetterContentProps> = (props) => (
  <dd>
    <FullName {...props} />
    <br />
    {getStreetWithApt(props)}
    <br />
    {props.city}, {props.state} {props.zipCode}
    <br />
    {formatPhoneNumber(props.phoneNumber)}
  </dd>
);

/**
 * The to/from addresses of the letter.
 */
const Addresses: React.FC<BaseLetterContentProps> = (props) => (
  <dl className="jf-letter-heading">
    <Trans description="heading of formal letter">
      <dt>To</dt>
      <LandlordAddress {...props} />
      <dt>From</dt>
      <Address {...props} />
    </Trans>
  </dl>
);

const DearLandlord: React.FC<BaseLetterContentProps> = (props) => (
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

/** An annoying workaround for both WeasyPrint and Lingui. */
const TitleNewline: React.FC<{}> = () => <>{"\n"}</>;

const Title: React.FC<{ children: React.ReactNode }> = (props) => (
  /*
   * We originally had a <br> in this <h1>, but React self-closes the
   * tag as <br/>, which WeasyPrint doesn't seem to like, so we'll
   * include an actual newline and set the style to preserve whitespace.
   */
  <h1 className="has-text-right" style={{ whiteSpace: "pre-wrap" }}>
    {props.children}
  </h1>
);

export const baseSampleLetterProps: BaseLetterContentProps = {
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
};

export function getBaseLetterContentPropsFromSession(
  session: AllSessionInfo
): BaseLetterContentProps | null {
  const onb = session.onboardingInfo;
  const ld = session.landlordDetails;
  if (!(ld && onb)) {
    return null;
  }

  const props: BaseLetterContentProps = {
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

export const letter = {
  Title,
  TitleNewline,
  TodaysDate,
  Addresses,
  DearLandlord,
  Regards,
  FullName,
  AddressLine,
  getFullName,
};
