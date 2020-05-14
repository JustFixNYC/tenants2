import React from "react";

import { getLatestStep } from "../progress-redirection";
import {
  ProgressRoutesProps,
  getAllSteps,
  ProgressRoutes,
} from "../progress-routes";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { FakeSessionInfo } from "../../tests/util";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { ProgressStepRoute, getBestNextStep } from "../progress-step-route";
import { SessionBuilder } from "../../tests/session-builder";

/**
 * A convenience class that makes it easier to test progress route flows.
 */
export class ProgressRoutesTester {
  /** A concatenation of all the steps in the flow. */
  readonly allSteps: ProgressStepRoute[];

  constructor(readonly props: ProgressRoutesProps, readonly name: string) {
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
          new AppTesterPal(this.render(), { url: step.path });
        });
      });
    });
  }
}
