import React from "react";

/** A US mailing address. */
export type MailingAddress = {
  primaryLine: string;
  city: string;
  state: string;
  zipCode: string;
};

/** A US mailing address, including a recipient name. */
export type MailingAddressWithName = {
  name: string;
} & MailingAddress;

/** Displays a US mailing address. */
export const MailingAddress: React.FC<MailingAddress> = (props) => (
  <>
    {props.primaryLine}
    <br />
    {props.city}, {props.state} {props.zipCode}
  </>
);

/** Displays a US mailing address, including the recipient name. */
export const MailingAddressWithName: React.FC<
  MailingAddressWithName & {
    nameLabel: string;
    addressLabel: string;
  }
> = (props) => (
  <dl>
    <dt>{props.nameLabel}</dt>
    <dd>{props.name}</dd>
    <dt>{props.addressLabel}</dt>
    <dd>
      <MailingAddress {...props} />
    </dd>
  </dl>
);

/**
 * A component for displaying recommended landlord information. If
 * an `intro` is not provided, a blurb about the information being
 * looked up from NYC HPD is displayed.
 */
export const RecommendedLandlordInfo: React.FC<{
  intro?: JSX.Element;
  landlord: MailingAddressWithName;
}> = ({ intro, landlord }) => {
  return (
    <>
      {intro || (
        <p>
          This is your landlord’s information as registered with the{" "}
          <b>NYC Department of Housing and Preservation (HPD)</b>. This may be
          different than where you send your rent checks.
        </p>
      )}
      <MailingAddressWithName
        {...landlord}
        nameLabel="Landlord name"
        addressLabel="Landlord address"
      />
    </>
  );
};
