import { getStepIndexForPathname } from "../progress-util";
import { BaseProgressStepRoute } from "../progress-bar";

const fakeSteps: BaseProgressStepRoute[] = [
  { path: '/foo', exact: true },
  { path: '/foo/2' },
  { path: '/foo/3' }
];

describe("getStepForPathname()", () => {
  it("logs a console warning if path is not found", () => {
    const warn = jest.fn();
    jest.spyOn(console, 'warn').mockImplementationOnce(warn);
    expect(getStepIndexForPathname('/blarg', fakeSteps, true)).toBe(-1);
    expect(warn).toBeCalled();
  });

  it("takes into account exact matches", () => {
    expect(getStepIndexForPathname('/foo', fakeSteps)).toBe(0);
    expect(getStepIndexForPathname('/foo/2', fakeSteps)).toBe(1);
    expect(getStepIndexForPathname('/foo/3', fakeSteps)).toBe(2);
  });
});
