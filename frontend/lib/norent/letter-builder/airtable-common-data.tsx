import * as _stateLegislation from "../../../../common-data/norent-state-law-for-builder.json";
import { USStateChoice } from "../../../../common-data/us-state-choices";

const stateLegislation = _stateLegislation as {
  [k in USStateChoice]?: {
    "Text of Legislation": string;
  };
};

export const getLegislationForState = (stateInput: string) => {
  const state = stateInput as USStateChoice;
  return state && stateLegislation && stateLegislation[state]
    ? stateLegislation[state]
    : null;
};
