import React from 'react';

import { getBestPrevStep, ProgressStepRoute } from "../progress-step-route";
import { BlankAllSessionInfo } from "../queries/AllSessionInfo";

describe("getBestPrevStep()", () => {
  const session = BlankAllSessionInfo;
  const render = () => <p>hi</p>;
  const steps: ProgressStepRoute[] = [
    { path: '/welcome', render },
    { path: '/first-name', render, isComplete: s => s.firstName !== null },
    { path: '/last-name', render },
  ];

  it("returns null when no previous step exists", () => {
    expect(getBestPrevStep(session, '/welcome', steps)).toBeNull();
  });

  it("returns null when no previous completed step exists", () => {
    expect(getBestPrevStep(session, '/last-name', steps.slice(1))).toBeNull();
  });

  it("skips past incomplete steps", () => {
    const step = getBestPrevStep(session, '/last-name', steps);
    expect(step && step.path).toBe('/welcome');
  });

  it("does not skip past completed steps", () => {
    const step = getBestPrevStep({ ...session, firstName: 'bop' }, '/last-name', steps);
    expect(step && step.path).toBe('/first-name');
  });
});
