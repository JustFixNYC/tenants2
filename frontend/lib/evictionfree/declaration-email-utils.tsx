import { AllSessionInfo } from "../queries/AllSessionInfo";
import { friendlyUTCDate } from "../util/date-util";

export type EvictionFreeDeclarationEmailProps = {
  firstName: string;
  fullName: string;
  landlordName: string;
  dateSubmitted: string;
  trackingNumber: string;
  indexNumber: string;
  courtName: string;
  wasEmailedToHousingCourt: boolean;
  wasEmailedToLandlord: boolean;
  wasMailedToLandlord: boolean;
  isInNyc: boolean;
  county: string | null;
  address: string;
};

export function sessionToEvictionFreeDeclarationEmailProps(
  s: AllSessionInfo
): EvictionFreeDeclarationEmailProps | null {
  const shd = s.submittedHardshipDeclaration;
  const ld = s.landlordDetails;
  const onb = s.onboardingInfo;

  if (!(shd && s.firstName && ld && ld.name && onb)) return null;

  const hdd = s.hardshipDeclarationDetails;

  return {
    firstName: s.firstName,
    fullName: `${s.firstName} ${s.lastName}`,
    landlordName: ld.name,
    dateSubmitted: friendlyUTCDate(shd.createdAt),
    indexNumber: hdd?.indexNumber ?? "",
    courtName: hdd?.courtName ?? "",
    trackingNumber: shd.trackingNumber,
    wasEmailedToHousingCourt: !!shd.emailedToHousingCourtAt,
    wasEmailedToLandlord: !!shd.emailedAt,
    wasMailedToLandlord: !!shd.mailedAt,
    isInNyc: !!onb.borough,
    county: onb.county,
    address: `${onb.address}, ${onb.city}, ${onb.state} ${onb.zipcode}`,
  };
}

export function evictionFreeDeclarationEmailFormalSubject(
  options: EvictionFreeDeclarationEmailProps
): string {
  const parts = ["Hardship Declaration", options.fullName];

  if (options.indexNumber) {
    parts.push(`Index #: ${options.indexNumber}`);
  }

  parts.push(`submitted ${options.dateSubmitted}`);

  return parts.join(" - ");
}
