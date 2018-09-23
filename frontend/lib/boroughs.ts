import { safeGetDjangoChoiceLabel } from "./common-data";

type BoroughDjangoChoice = [BoroughChoice, string];

export const BOROUGH_CHOICES = require('../../common-data/borough-choices.json') as BoroughDjangoChoice[];

export enum BoroughChoice {
  MANHATTAN = 'MANHATTAN',
  BRONX = 'BRONX',
  BROOKLYN = 'BROOKLYN',
  QUEENS = 'QUEENS',
  STATEN_ISLAND = 'STATEN_ISLAND'
}

export function getBoroughLabel(borough: string): string|null {
  return safeGetDjangoChoiceLabel(BOROUGH_CHOICES, borough);
}
