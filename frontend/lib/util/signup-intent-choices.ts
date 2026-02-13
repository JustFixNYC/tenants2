import { t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import {
  SignupIntent,
  SignupIntentLabels,
} from "../../../common-data/signup-intent-choices";

/**
 * Returns translated signup intent labels.
 */
export function getSignupIntentLabels(): SignupIntentLabels {
  return {
    LOC: li18n._(t`Letter of Complaint`),
    HP: li18n._(t`HP Action`),
    EHP: li18n._(t`Emergency HP Action`),
    NORENT: li18n._(t`No rent letter`),
    EVICTIONFREE: li18n._(t`Eviction free`),
    LALETTERBUILDER: li18n._(t`LA Tenant Action Center`),
  };
}
