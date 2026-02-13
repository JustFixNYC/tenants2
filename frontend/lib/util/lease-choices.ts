import { t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { LeaseChoice } from "../../../common-data/lease-choices";

/**
 * Returns translated lease choice labels.
 */
export function getLeaseChoiceLabels(): Record<LeaseChoice, string> {
  return {
    RENT_STABILIZED: li18n._(t`Rent Stabilized`),
    RENT_CONTROLLED: li18n._(t`Rent Controlled`),
    OTHER_AFFORDABLE: li18n._(
      t`Affordable housing (other than rent-stabilized)`
    ),
    MARKET_RATE: li18n._(t`Market Rate`),
    NYCHA: li18n._(t`NYCHA/Public Housing (includes RAD/PACT)`),
    NOT_SURE: li18n._(t`I'm not sure`),
    NO_LEASE: li18n._(t`I don't have a lease`),
    RENT_STABILIZED_OR_CONTROLLED: li18n._(
      t`Either Rent Stabilized or Rent Controlled (legacy option)`
    ),
  };
}
