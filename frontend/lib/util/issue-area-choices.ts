import { t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import { IssueAreaChoiceLabels } from "../../../common-data/issue-area-choices";

/**
 * Returns translated issue area choice labels.
 */
export function getIssueAreaChoiceLabels(): IssueAreaChoiceLabels {
  return {
    BEDROOMS: li18n._(t`Bedrooms`),
    KITCHEN: li18n._(t`Kitchen`),
    LIVING_ROOM: li18n._(t`Living room`),
    BATHROOMS: li18n._(t`Bathrooms`),
    HOME: li18n._(t`Home-wide`),
    PUBLIC_AREAS: li18n._(t`Building-wide`),
  };
}
