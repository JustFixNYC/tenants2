import React from "react";
import {
  USStateChoice,
  isUSStateChoice,
} from "../../../../common-data/us-state-choices";
import { AllSessionInfo } from "../../queries/AllSessionInfo.js";
import { useContext } from "react";
import { AppContext } from "../../app-context";
import loadable, { LoadableLibrary } from "@loadable/component";
import i18n, { SupportedLocale } from "../../i18n";

type StateLawForBuilderEntry = {
  linkToLegislation?: string;
  textOfLegislation?: string;
  stateWithoutProtections: boolean;
};

export enum CovidStateLawVersion {
  V1_NON_PAYMENT = "V1 non-payment",
  V2_HARDSHIP = "V2 hardship",
  V3_FEW_PROTECTIONS = "V3 few protections",
}

type StateLawForLetterEntry = {
  whichVersion: CovidStateLawVersion;
  textOfLegislation: string[];
};

export type StatePartnerForBuilderEntry = {
  organizationName: string;
  organizationWebsiteLink: string;
};

export const DefaultStatePartnerForBuilder = {
  organizationName: "Right to the City Alliance",
  organizationWebsiteLink: "https://cancelrent.us/",
};

type StateDocumentationRequirementsEntry = {
  doesTheTenantNeedToSendTheDocumentationToTheLandlord: boolean;
  isDocumentationALegalRequirement: boolean;
  numberOfDaysFromNonPaymentNoticeToProvideDocumentation?: number;
};

type StateLegalAidProviderEntry = {
  localLegalAidProviderLink: string;
};

type StateMapping<T> = {
  [k in USStateChoice]: T;
};

export type LocalizedNationalMetadata = {
  locale: SupportedLocale;
  lawForBuilder: StateMapping<StateLawForBuilderEntry>;
  lawForLetter: StateMapping<StateLawForLetterEntry>;
  partnersForBuilder: Partial<StateMapping<StatePartnerForBuilderEntry>>;
  documentationRequirements: StateMapping<StateDocumentationRequirementsEntry>;
  legalAidProviders: StateMapping<StateLegalAidProviderEntry>;
};

/**
 * Return the given string as a U.S. state choice, throwing an
 * error if it's invalid.
 */
export const assertIsUSState = (state: string): USStateChoice => {
  if (!isUSStateChoice(state)) {
    throw new Error(`${state} is not a valid two-letter US state!`);
  }
  return state;
};

export type NorentMetadataForUSState = ReturnType<
  typeof getNorentMetadataForUSState
>;

/**
 * We use code splitting to make sure that we only load the national
 * metadata needed for our currently selected locale.
 *
 * This defines the type of component whose children prop is a
 * callable that receives localized national metadata as its only
 * argument.
 */
type LoadableNationalMetadata = LoadableLibrary<{
  metadata: LocalizedNationalMetadata;
}>;

const EnNationalMetadata: LoadableNationalMetadata = loadable.lib(() =>
  import("./national-metadata-en")
);

const EsNationalMetadata: LoadableNationalMetadata = loadable.lib(() =>
  import("./national-metadata-es")
);

/**
 * Returns a component that loads the national metadata for
 * the given locale.
 */
function getLoadableForLanguage(
  locale: SupportedLocale
): LoadableNationalMetadata {
  switch (locale) {
    case "en":
      return EnNationalMetadata;
    case "es":
      return EsNationalMetadata;
  }
}

/**
 * Our global singleton representing the national metadata for the
 * current locale. It's null if no metadata has been loaded yet.
 */
let localizedMetadata: LocalizedNationalMetadata | null = null;

/**
 * Sets the national metadata for the current locale. This is only
 * intended for use by test suites.
 */
export function setLocalizedNationalMetadata(value: LocalizedNationalMetadata) {
  localizedMetadata = value;
}

/**
 * Loads the national metadata for the currently selected
 * locale, as dictated by our global i18n module. Children
 * will then be rendered with the metadata loaded.
 *
 * While a loading message will appear while the metadata is being loaded,
 * because we do server-side rendering and pre-load JS bundles in the
 * server-rendered HTML output, the user won't see the message most
 * (possibly all) of the time.
 *
 * Note that this component is currently a singleton; more than one
 * instance of it should never exist in a component tree at once.
 */
export const LocalizedNationalMetadataProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const LoadableMetadata = getLoadableForLanguage(i18n.locale);

  return (
    <LoadableMetadata fallback={<p>Loading localized national metadata...</p>}>
      {({ metadata }) => {
        setLocalizedNationalMetadata(metadata);
        return props.children;
      }}
    </LoadableMetadata>
  );
};

/**
 * Return a big blob of metadata about NoRent.org-related information
 * for the given U.S. state.
 *
 * This should only be called once national metadata has been loaded.
 */
export const getNorentMetadataForUSState = (state: USStateChoice) => {
  if (!localizedMetadata) {
    throw new Error("Localized national metadata has not been loaded!");
  }

  return {
    locale: localizedMetadata.locale,
    lawForBuilder: localizedMetadata.lawForBuilder[state],
    lawForLetter: localizedMetadata.lawForLetter[state],
    partner: localizedMetadata.partnersForBuilder[state],
    docs: localizedMetadata.documentationRequirements[state],
    legalAid: localizedMetadata.legalAidProviders[state],
  };
};

/**
 * Returns whether the given state is one with tenant protections
 * regarding the non-payment of rent.
 *
 * This should only be called once national metadata has been loaded.
 */
function isInStateWithProtections(state: string | null | undefined): boolean {
  // This is kind of arbitrary, it shouldn't ever happen, but we want
  // to return a boolean and very few states have no protections so
  // we're just going to return true.
  if (!state) return true;

  return !getNorentMetadataForUSState(assertIsUSState(state)).lawForBuilder
    .stateWithoutProtections;
}

/**
 * A React Hook indicating whether the user who is currently
 * onboarding is in a state with tenant protections regarding the
 * non-payment of rent.
 *
 * This should only be called once national metadata has been loaded.
 */
export function useIsOnboardingUserInStateWithProtections(): boolean {
  const s = useContext(AppContext).session;
  return isInStateWithProtections(s.onboardingScaffolding?.state);
}

/**
 * Returns whether the given session representing a user who is currently
 * onboarding is in a state with tenant protections regarding the
 * non-payment of rent.
 *
 * This should only be called once national metadata has been loaded.
 */
export function isOnboardingUserInStateWithProtections(
  s: AllSessionInfo
): boolean {
  return isInStateWithProtections(s.onboardingScaffolding?.state);
}

/**
 * Returns whether the given session representing a logged-in user
 * is in a state with tenant protections regarding the
 * non-payment of rent.
 *
 * This should only be called once national metadata has been loaded.
 */
export function isLoggedInUserInStateWithProtections(
  s: AllSessionInfo
): boolean {
  return isInStateWithProtections(s.onboardingInfo?.state);
}
