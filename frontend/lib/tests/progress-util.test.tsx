import { getStepIndexForPathname, getRelativeStep } from "../progress-util";
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

describe("getRelativeStep()", () => {
  it("returns next step", () => {
    expect(getRelativeStep('/foo', 'next', fakeSteps))
      .toEqual({ path: '/foo/2' });
  });

  it("returns prev step", () => {
    expect(getRelativeStep('/foo/3', 'prev', fakeSteps))
      .toEqual({ path: '/foo/2' });
  });

  it("returns null on invalid step", () => {
    expect(getRelativeStep('/blah', 'prev', fakeSteps))
      .toBeNull();
  });

  it("returns null when no previous step exists", () => {
    expect(getRelativeStep('/foo', 'prev', fakeSteps))
      .toBeNull();
  });

  it("returns null when no next step exists", () => {
    expect(getRelativeStep('/foo/3', 'next', fakeSteps))
      .toBeNull();
  });
});
