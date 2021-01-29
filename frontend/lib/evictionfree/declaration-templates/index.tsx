import React from "react";

import { HardshipDeclarationVariablesQuery_output } from "../../queries/HardshipDeclarationVariablesQuery";

export type HardshipDeclarationProps = HardshipDeclarationVariablesQuery_output;

export type HardshipDeclarationFC = React.FC<HardshipDeclarationProps>;

export const HardshipDeclarationCheckbox: React.FC<{ checked: boolean }> = ({
  checked,
}) => <big className="has-text-weight-bold">{checked ? "☑ " : "☐ "}</big>;

/**
 * Intended to visibly distinguish fields in the hardship declaration that
 * the user has direct control over versus those that they do not have
 * control over.
 */
export const HardshipDeclarationFilledField: React.FC<{ children: string }> = ({
  children: text,
}) => <span className="jf-efny-filled-field">{text}</span>;
