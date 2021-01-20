import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppContext } from "../app-context";
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
const FORCE_MANUAL_SEARCH = `?${FORCE_QS_VAR}=${FORCE_MANUAL}`;
const FORCE_RECOMMENDED_SEARCH = `?${FORCE_QS_VAR}=${FORCE_RECOMMENDED}`;

type LandlordPageContentProps = {
  /** The landlord we recommend the user proceed with. */
  recommendedLandlord: MailingAddressWithName | null;

  /**
   * The instructions to ask of the user if we don't have a
   * recommended landlord.
   */
  defaultIntro?: JSX.Element;

  /**
   * Whether to forcibly disallow the user from overriding our
   * recommended landlord.
   */
  disallowManualOverride?: boolean;

  /**
   * A function that renders the recommended landlord.
   */
  renderReadOnlyLandlordDetails: (
    options: RenderReadOnlyLandlordDetailsOptions
  ) => JSX.Element;

  /**
   * A function that renders everything after the introductory
   * text.
   */
  children: (ctx: LandlordPageContext) => JSX.Element;
};

type LandlordPageContext = {
  /**
   * If the current page represents the user choosing to
   * override a recommended landlord with manually-specified
   * details or vice-versa, this is the link to go back to
   * just using whatever the current settings are.
   */
  toUnforcedHref: string | null;

  /**
   * Whether or not we're currently using the recommended
   * landlord or not.
   */
  useRecommended: boolean;
};

export type RenderReadOnlyLandlordDetailsOptions = {
  /**
   * The landlord we recommend.
   */
  landlord: MailingAddressWithName;

  /**
   * A link allowing the user to override our landlord recommendation
   * with details they manually provide.
   */
  forceManualHref: string;
};

/**
 * A component for viewing and/or editing the user's landlord details,
 * optionally allowing the user to forcibly override a recommended
 * landlord with manually-provided details and vice-versa. It only
 * contains enough view logic to display introductory text; a
 * form element must be rendered by the children, which is a function
 * that is passed contextual information about how the page
 * should be displayed.
 *
 * Note that forcibly overriding the default uses the current location's
 * querystring.
 */
export const LandlordPageContent: React.FC<LandlordPageContentProps> = ({
  defaultIntro,
  recommendedLandlord,
  disallowManualOverride,
  renderReadOnlyLandlordDetails,
  children,
}) => {
  const { session } = useContext(AppContext);
  const loc = useLocation();
  const llDetails = session.landlordDetails;
  const { useRecommended, isForced } = determineLandlordPageOptions({
    hasRecommendedLandlord: !!recommendedLandlord,
    landlordDetails: llDetails,
    search: loc.search,
    disallowManualOverride,
  });

  let intro = defaultIntro ?? (
    <p>
      Please enter your landlord's name and contact information below. You can
      find this information on your lease and/or rent receipts.
    </p>
  );

  if (recommendedLandlord) {
    if (useRecommended) {
      intro = renderReadOnlyLandlordDetails({
        landlord: recommendedLandlord,
        forceManualHref: FORCE_MANUAL_SEARCH,
      });
    } else {
      intro = (
        <p>
          You have chosen to overwrite the landlord recommended by JustFix.nyc.
          Please provide your own details below, or{" "}
          <Link to={FORCE_RECOMMENDED_SEARCH}>
            use the recommended landlord "{recommendedLandlord.name}"
          </Link>
          .
        </p>
      );
    }
  }

  return (
    <React.Fragment key={useRecommended.toString()}>
      {intro}
      {children({
        useRecommended,
        toUnforcedHref: isForced ? loc.pathname : null,
      })}
    </React.Fragment>
  );
};

function determineLandlordPageOptions(options: {
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
    !llDetails?.isLookedUp && llDetails?.name
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
