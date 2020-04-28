import React from "react";
import {
  withSessionErrorHandling,
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

type MiddleStepComponent = React.ComponentType<MiddleProgressStepProps>;
type StepComponent = React.ComponentType<ProgressStepProps>;

export function hasNorentLetterBeenSentForThisRentPeriod(
  s: AllSessionInfo
): boolean {
  const letter = s.norentLatestLetter;
  const rentPeriod = s.norentLatestRentPeriod;
  if (!(letter && rentPeriod)) return false;
  return letter.paymentDate === rentPeriod.paymentDate;
}

export const NorentRequireLoginStep = (c: StepComponent) =>
  withSessionErrorHandling(isUserLoggedOut, NorentNotLoggedInErrorPage, c);

const requireLogout = (c: StepComponent) =>
  withSessionErrorHandling(isUserLoggedIn, NorentAlreadyLoggedInErrorPage, c);

const requireNotSentLetter = (c: StepComponent) =>
  NorentRequireLoginStep(
    withSessionErrorHandling(
      hasNorentLetterBeenSentForThisRentPeriod,
      NorentAlreadySentLetterErrorPage,
      c
    )
  );

export const NorentOnboardingStep = (c: MiddleStepComponent) =>
  requireLogout(MiddleProgressStep(c));

export const NorentNotSentLetterStep = (c: MiddleStepComponent) =>
  requireNotSentLetter(MiddleProgressStep(c));
