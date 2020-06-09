import React from "react";
import { BreaksBetweenLines } from "../ui/breaks-between-lines";
import { formatPhoneNumber } from "../forms/phone-number-form-field";
import { Trans } from "@lingui/macro";
import { friendlyUTCDate, friendlyDate } from "./date-util";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { assertNotNull } from "./util";

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

type StringHelper<T> = (props: T) => string;

export interface StringHelperFC<T> {
  (fn: StringHelper<T>): React.FC<T>;
}

/**
 * Some of our helper functions that build strings out of our props
 * are slightly easier to read as components, so this function
 * just converts a helper to a component.
 */
export function stringHelperFC<T>(fn: StringHelper<T>): React.FC<T> {
  return (props) => <>{fn(props)}</>;
}

const componentizeHelper: StringHelperFC<BaseLetterContentProps> = stringHelperFC;

export const LandlordName = componentizeHelper((props) =>
  props.landlordName.toUpperCase()
);

export const getFullName = (props: BaseLetterContentProps) =>
  `${props.firstName} ${props.lastName}`;

export const FullName = componentizeHelper(getFullName);

const getTodaysDate = (props: BaseLetterContentProps) =>
  props.todaysDate
    ? friendlyUTCDate(props.todaysDate)
    : friendlyDate(new Date());

export const TodaysDate: React.FC<BaseLetterContentProps> = (props) => (
  <p className="has-text-right">{getTodaysDate(props)}</p>
);

export const getStreetWithApt = ({
  street,
  aptNumber,
}: Pick<BaseLetterContentProps, "street" | "aptNumber">) => {
  if (!aptNumber) return street;
  return `${street} #${aptNumber}`;
};

export const AddressLine = componentizeHelper(
  (props) =>
    `${getStreetWithApt(props)}, ${props.city}, ${props.state} ${props.zipCode}`
);

export const LandlordAddress: React.FC<BaseLetterContentProps> = (props) => (
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

export const Address: React.FC<BaseLetterContentProps> = (props) => (
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
 * The to/from address of the letter.
 */
export const LetterHeading: React.FC<BaseLetterContentProps> = (props) => (
  <dl className="jf-letter-heading">
    <Trans description="heading of formal letter">
      <dt>To</dt>
      <LandlordAddress {...props} />
      <dt>From</dt>
      <Address {...props} />
    </Trans>
  </dl>
);

export const DearLandlord: React.FC<BaseLetterContentProps> = (props) => (
  <p>
    <Trans description="salutation of formal letter">
      Dear <LandlordName {...props} />,
    </Trans>
  </p>
);

export const Regards: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <p className="jf-signature">
    <Trans description="before signature in formal letter">Regards,</Trans>
    {children}
  </p>
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
