import React from "react";

import { HardshipDeclarationVariablesQuery_output } from "../../queries/HardshipDeclarationVariablesQuery";

export type HardshipDeclarationProps = HardshipDeclarationVariablesQuery_output;

export type HardshipDeclarationFC = React.FC<HardshipDeclarationProps>;

export const HardshipDeclarationCheckbox: React.FC<{ checked: boolean }> = ({
  checked,
}) => <big className="has-text-weight-bold">{checked ? "☑ " : "☐ "}</big>;
