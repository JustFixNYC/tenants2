import { t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

export const getHousingTypeFieldLabel = () => li18n._(t`Housing type`);
export const getPublicAssistanceQuestionText = () =>
  li18n._(
    t`Do you receive a housing voucher or subsidy (Section 8 Voucher, FHEPS, CITYFHEPS, HASA, etc.)?`
  );
export const getPublicAssistanceSectionDescription = () =>
  li18n._(t`For example, Section 8 Voucher, FHEPS, CITYFHEPS, HASA, etc.`);
export const getPublicAssistanceSectionLabel = () =>
  li18n._(t`Housing voucher?`);
