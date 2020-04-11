import { AllSessionInfo } from '../queries/AllSessionInfo';
import { OnboardingInfoLeaseType } from '../queries/globalTypes';
import ADDRESS from '../../../common-data/nycha-address.json';

/**
 * Our legacy address format. We used to store addresses as a big
 * blob of text, but now we store them as individual components; still,
 * some of our legacy code and data uses the old format, which this
 * type represents.
 */
export type LegacyAddressDetails = {
  name: string,
  address: string,
};

/** The address of the central NYCHA office, in our legacy address format. */
export const LEGACY_NYCHA_ADDRESS: LegacyAddressDetails = {
  name: ADDRESS.name,
  address: [
    `${ADDRESS.primaryLine}`,
    `${ADDRESS.city}, ${ADDRESS.state} ${ADDRESS.zipCode}`
  ].join('\n'),
};

/** The address of the central NYCHA office. */
export const NYCHA_ADDRESS = ADDRESS;

/**
 * Returns whether the given session data represents a user who lives in
 * NYCHA housing.
 * 
 * If the user is logged out or hasn't completed onboarding, this will
 * return false.
 * 
 * Note that this algorithm isn't currently ideal; see
 * https://github.com/JustFixNYC/tenants2/issues/1140 for more details.
 */
export function isUserNycha(session: AllSessionInfo): boolean {
  return session.onboardingInfo
    ? session.onboardingInfo.leaseType === OnboardingInfoLeaseType.NYCHA
    : false;
}
