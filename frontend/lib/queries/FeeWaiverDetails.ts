// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FeeWaiverDetailsIncomeFrequency } from "./globalTypes";

// ====================================================
// GraphQL fragment: FeeWaiverDetails
// ====================================================

export interface FeeWaiverDetails {
  incomeFrequency: FeeWaiverDetailsIncomeFrequency;
  incomeAmount: number;
  incomeSrcEmployment: boolean;
  incomeSrcHra: boolean;
  incomeSrcChildSupport: boolean;
  incomeSrcAlimony: boolean;
  rentAmount: number;
  expenseUtilities: boolean;
  expenseCable: boolean;
  expenseChildcare: boolean;
  expensePhone: boolean;
  askedBefore: boolean;
}

export const graphQL = `fragment FeeWaiverDetails on FeeWaiverType {
    incomeFrequency,
    incomeAmount,
    incomeSrcEmployment,
    incomeSrcHra,
    incomeSrcChildSupport,
    incomeSrcAlimony,
    rentAmount,
    expenseUtilities,
    expenseCable,
    expenseChildcare,
    expensePhone,
    askedBefore
}
`;