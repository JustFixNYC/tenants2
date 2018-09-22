type MockFetch = jest.Mock & typeof MockFetchMixin;

const MockFetchMixin = {
  mockReturnJson(this: jest.Mock, result: any) {
    this.mockResolvedValue({ json: () => Promise.resolve(result) });
  },
  resolvePromises(): Promise<void> {
    return new Promise((resolve) => {
      process.nextTick(resolve);
    });
  },
  resolvePromisesAndTimers(): Promise<void> {
    jest.runAllTimers();
    return this.resolvePromises();
  }
};

export function createMockFetch(): MockFetch {
  const mock = jest.fn();
  window.fetch = mock;
  return Object.assign(mock, MockFetchMixin);
};
