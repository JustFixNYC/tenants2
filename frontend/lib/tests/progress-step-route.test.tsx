import React from 'react';

import { getBestPrevStep, ProgressStepRoute, getBestNextStep } from "../progress-step-route";
import { BlankAllSessionInfo } from "../queries/AllSessionInfo";

const session = BlankAllSessionInfo;
const render = () => <p>hi</p>;
const steps: ProgressStepRoute[] = [
  { path: '/welcome', render },
  { path: '/first-name', render, isComplete: s => s.firstName !== null },
  { path: '/last-name', render },
  { path: '/no-boop', render, shouldBeSkipped: s => s.csrfToken === 'boop' },
  { path: '/end', render }
];

describe("getBestPrevStep()", () => {
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

  it("skips past steps that want to be skipped", () => {
    const step = getBestPrevStep({ ...session, csrfToken: 'boop' }, '/end', steps);
    expect(step && step.path).toBe('/last-name');
  });

  it("does not skip past steps that do not want to be skipped", () => {
    const step = getBestPrevStep({ ...session }, '/end', steps);
    expect(step && step.path).toBe('/no-boop');
  });
});

describe("getBestNextStep()", () => {
  it("returns null when no next step exists", () => {
    expect(getBestNextStep(session, '/end', steps)).toBeNull();
  });

  it("skips past steps that want to be skipped", () => {
    const step = getBestNextStep({ ...session, csrfToken: 'boop' }, '/last-name', steps);
    expect(step && step.path).toBe('/end');
  });

  it("does not skip past steps that do not want to be skipped", () => {
    const step = getBestNextStep({ ...session }, '/last-name', steps);
    expect(step && step.path).toBe('/no-boop');
  });
});
