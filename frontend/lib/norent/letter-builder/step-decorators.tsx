import React from "react";
import {
  NorentNotLoggedInErrorPage,
  NorentAlreadyLoggedInErrorPage,
  NorentAlreadySentLetterErrorPage,
} from "./error-pages";
import { isUserLoggedOut, isUserLoggedIn } from "../../util/session-predicates";
import {
  ProgressStepProps,
  MiddleProgressStepProps,
  MiddleProgressStep,
} from "../../progress/progress-step-route";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { withSessionErrorHandling } from "../../ui/session-error-handling";

type MiddleStepComponent = React.ComponentType<MiddleProgressStepProps>;
type StepComponent = React.ComponentType<ProgressStepProps>;

/**
 * Returns whether the current user has sent a no rent letter
 * for all available rent periods.
 */
export function hasNorentLetterBeenSentForAllRentPeriods(
  s: AllSessionInfo
): boolean {
  const letter = s.norentLatestLetter;
  return s.norentAvailableRentPeriods.length === 0 && !!letter;
}

/**
 * Returns whether the user has sent at least one no rent letter.
 */
export function hasNorentLetterBeenSent(s: AllSessionInfo): boolean {
  return !!s.norentLatestLetter;
}

/**
 * Returns whether the user has never sent any no rent letters.
 */
export function hasNorentLetterNeverBeenSent(s: AllSessionInfo): boolean {
  return !hasNorentLetterBeenSent(s);
}

/**
 * A step that requires the user to be logged-in to view.
 */
export const NorentRequireLoginStep = (c: StepComponent) =>
  withSessionErrorHandling(isUserLoggedOut, NorentNotLoggedInErrorPage, c);

const requireLogout = (c: StepComponent) =>
  withSessionErrorHandling(isUserLoggedIn, NorentAlreadyLoggedInErrorPage, c);

const requireNotSentLetter = (c: StepComponent) =>
  NorentRequireLoginStep(
    withSessionErrorHandling(
      hasNorentLetterBeenSentForAllRentPeriods,
      NorentAlreadySentLetterErrorPage,
      c
    )
  );

/**
 * A middle step before the user has created an account.
 */
export const NorentOnboardingStep = (c: MiddleStepComponent) =>
  requireLogout(MiddleProgressStep(c));

/**
 * A middle step after the user has created an account, but
 * before they have sent a no rent letter for the current
 * rent period.
 */
export const NorentNotSentLetterStep = (c: MiddleStepComponent) =>
  requireNotSentLetter(MiddleProgressStep(c));
