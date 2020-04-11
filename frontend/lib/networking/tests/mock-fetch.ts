import { nextTick } from "../../tests/util";

/**
 * This is an API for a mock window.fetch, which provides
 * some convenience methods for network communications.
 */
interface MockFetch extends jest.MockInstance<any, any> {
  /** Mock the return of a JSON response. */
  mockReturnJson(result: any): void;

  /**
   * Fetch returns a promise, and we need to cycle the
   * event loop in order to process it. That's what this
   * method does.
   */
  resolvePromises(): Promise<void>;

  /**
   * It's often the case that one needs to cycle the
   * event loop and run any pending jest timers, so this
   * is a convenience method to provide that.
   */
  resolvePromisesAndTimers(): Promise<void>;
}

/** Create and return a mock window.fetch API. */
export function createMockFetch(): MockFetch {
  const mock = jest.fn();
  window.fetch = mock;
  return Object.assign(mock, {
    mockReturnJson(this: jest.Mock, result: any) {
      this.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(result),
      });
    },
    resolvePromises(): Promise<void> {
      return nextTick();
    },
    resolvePromisesAndTimers(): Promise<void> {
      jest.runAllTimers();
      return this.resolvePromises();
    },
  });
}
