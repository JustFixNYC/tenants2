import React from "react";
import { AllSessionInfo_landlordDetails } from "../queries/AllSessionInfo";
import { getQuerystringVar } from "../util/querystring";

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

const FORCE_QS_VAR = "force";
const FORCE_MANUAL = "manual";
const FORCE_RECOMMENDED = "rec";
export const FORCE_MANUAL_SEARCH = `?${FORCE_QS_VAR}=${FORCE_MANUAL}`;
export const FORCE_RECOMMENDED_SEARCH = `?${FORCE_QS_VAR}=${FORCE_RECOMMENDED}`;

export function determineLandlordPageOptions(options: {
  hasRecommendedLandlord: boolean;
  landlordDetails: AllSessionInfo_landlordDetails | null;
  search: string;
  disallowManualOverride?: boolean;
}) {
  const llDetails = options.landlordDetails;
  const forceQs = getQuerystringVar(options.search, FORCE_QS_VAR);
  const forceManual =
    forceQs === FORCE_MANUAL && !options.disallowManualOverride;
  const forceRecommended = forceQs === FORCE_RECOMMENDED;
  const isLandlordAlreadyManuallySpecified = !!(
    !llDetails?.isLookedUp &&
    llDetails?.name &&
    llDetails.address
  );
  let useRecommended = shouldUseRecommendedLandlordInfo({
    hasRecommendedLandlord: options.hasRecommendedLandlord,
    isLandlordAlreadyManuallySpecified,
    forceManual,
    forceRecommended,
  });

  return { useRecommended, isForced: forceManual || forceRecommended };
}

function shouldUseRecommendedLandlordInfo(options: {
  hasRecommendedLandlord: boolean;
  isLandlordAlreadyManuallySpecified: boolean;
  forceManual: boolean;
  forceRecommended: boolean;
}): boolean {
  let useRecommended: boolean;

  if (options.hasRecommendedLandlord) {
    if (options.isLandlordAlreadyManuallySpecified) {
      if (options.forceRecommended) {
        useRecommended = true;
      } else {
        useRecommended = false;
      }
    } else if (options.forceManual) {
      useRecommended = false;
    } else {
      useRecommended = true;
    }
  } else {
    useRecommended = false;
  }

  return useRecommended;
}

export const privateLandlordHelpersForTesting = {
  shouldUseRecommendedLandlordInfo,
};
