import React from "react";

import { getLatestStep } from "../progress-redirection";
import {
  ProgressRoutesProps,
  getAllSteps,
  ProgressRoutes,
} from "../progress-routes";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { FakeSessionInfo } from "../../tests/util";
import { AppTesterPal, AppTesterPalOptions } from "../../tests/app-tester-pal";
import { ProgressStepRoute, getBestNextStep } from "../progress-step-route";
import { SessionBuilder, newSb } from "../../tests/session-builder";

/**
 * A convenience class that makes it easier to test progress route flows.
 */
export class ProgressRoutesTester {
  /** A concatenation of all the steps in the flow. */
  readonly allSteps: ProgressStepRoute[];

  constructor(
    readonly props: ProgressRoutesProps,
    readonly name: string,
    readonly appTesterPalOptions: Partial<AppTesterPalOptions> = {}
  ) {
    this.allSteps = getAllSteps(props);
  }

  /** Render the progress routes. */
  render(): JSX.Element {
    return <ProgressRoutes {...this.props} />;
  }

  /** Returns the path to the very first step. */
  get firstStep(): string {
    return this.allSteps[0].path;
  }

  /**
   * Returns the paths to the next `count` steps, given a session
   * and an optional starting path.
   */
  getNextSteps(count: number, sb: SessionBuilder, path = this.firstStep) {
    return Array.from(this.nextStepIterator(sb, path)).slice(0, count);
  }

  /**
   * Helper to define a test that runs through a series of steps
   * given by an initial session and initial step, making assertions
   * at each step along the way.
   */
  defineTest(options: DefineTestOptions) {
    it(options.it, () => {
      const { usingSession: sb, expectSteps } = options;
      const path = options.startingAtStep || this.firstStep;
      const steps = this.getNextSteps(expectSteps.length, sb, path);
      expect(steps.length).toBe(expectSteps.length);
      const el = this.render();
      const pal = new AppTesterPal(el, {
        ...this.appTesterPalOptions,
        session: sb.value,
        url: path,
      });
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const sa = normalizeStepAssertion(expectSteps[i]);
        expect(step).toBe(sa.url);
        pal.history.push(step);
        sa.test(pal);
      }
    });
  }

  /**
   * Returns an iterator over all step paths after the optional starting path,
   * given a session.
   */
  *nextStepIterator(sb: SessionBuilder, path = this.firstStep) {
    while (true) {
      const step = getBestNextStep(sb.value, path, this.allSteps);
      if (!step) return;
      path = step.path;
      yield path;
    }
  }

  /**
   * Given a subset of the session, return what the routes dictate the
   * latest "un-completed" step is.
   */
  getLatestStep(session: Partial<AllSessionInfo> = {}): string {
    return getLatestStep({ ...FakeSessionInfo, ...session }, this.allSteps);
  }

  /**
   * Define a bunch of smoke tests for the routes that just visit
   * each route and make sure an exception isn't thrown.
   */
  defineSmokeTests() {
    describe(`${this.name} steps`, () => {
      this.allSteps.forEach((step) => {
        it(`${step.path} renders without throwing`, () => {
          new AppTesterPal(this.render(), {
            session: newSb().withLoggedInUser().value,
            ...this.appTesterPalOptions,
            url: step.path,
          });
        });
      });
    });
  }
}

type FullStepAssertion = { url: string; test: AssertionFn };

type StepAssertion = string | FullStepAssertion;

type AssertionFn = (pal: AppTesterPal) => void;

const noopAsserter: AssertionFn = () => {};

function normalizeStepAssertion(sa: StepAssertion): FullStepAssertion {
  return typeof sa === "string" ? { url: sa, test: noopAsserter } : sa;
}

/** Options for `ProgressRoutesTester.defineTest()`. */
type DefineTestOptions = {
  /** The name of the test, used as the first parameter for Jest's `it()` function. */
  it: string;

  /** The session used by the test. */
  usingSession: SessionBuilder;

  /** The step to start at; defaults to the first step. */
  startingAtStep?: string;

  /**
   * What steps the progress routes are expected to go through, not including
   * the initial step.
   *
   * Each entry in the array can be either a string identifying the URL we
   * expect to be at, or an object identifying the URL and a test function
   * that can make further assertions about the content of the step.
   */
  expectSteps: StepAssertion[];
};
