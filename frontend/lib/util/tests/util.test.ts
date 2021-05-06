import {
  callOnceWithinMs,
  getFunctionProperty,
  exactSubsetOrDefault,
  twoTuple,
  isDeepEqual,
  properNoun,
  numberWithCommas,
  friendlyPhoneNumber,
} from "../util";
import { assertNotNull, assertNotUndefined, hardFail } from "@justfixnyc/util";

describe("properNoun()", () => {
  it("works", () => {
    expect(properNoun("STATEN ISLAND")).toEqual("Staten Island");
  });
});

describe("assertNotNull()", () => {
  it("raises exception when null", () => {
    expect(() => assertNotNull(null)).toThrowError(
      "expected argument to not be null"
    );
  });

  it("returns argument when not null", () => {
    expect(assertNotNull("")).toBe("");
  });
});

describe("hardFail()", () => {
  it("throws an error", () => {
    expect(() => hardFail()).toThrowError(
      "Code should never reach this point!"
    );
    expect(() => hardFail("boop")).toThrowError("boop");
  });
});

describe("assertNotUndefined()", () => {
  it("raises exception when undefined", () => {
    expect(() => assertNotUndefined(undefined)).toThrowError(
      "expected argument to not be undefined"
    );
  });

  it("returns argument when not undefined", () => {
    expect(assertNotUndefined(null)).toBe(null);
  });
});

describe("callOnceWithinMs()", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it("calls the callback if the given time has elapsed", () => {
    const cb = jest.fn();
    callOnceWithinMs(cb, 100);
    jest.advanceTimersByTime(200);
    expect(cb.mock.calls).toHaveLength(1);
  });

  it("does not call the callback if it has already been called", () => {
    const cb = jest.fn();
    const wrapper = callOnceWithinMs(cb, 1000);
    jest.advanceTimersByTime(200);
    wrapper();
    expect(cb.mock.calls).toHaveLength(1);
    jest.advanceTimersByTime(2000);
    expect(cb.mock.calls).toHaveLength(1);
  });

  it("ensures the callback can only be called once by clients", () => {
    const cb = jest.fn();
    const wrapper = callOnceWithinMs(cb, 1000);
    wrapper();
    wrapper();
    expect(cb.mock.calls).toHaveLength(1);
  });
});

test("getFunctionProperty() works", () => {
  const fn = () => {};

  for (let thing of [{}, fn, { fn }, null, undefined]) {
    expect(getFunctionProperty(thing, "blop")).toBeUndefined();
  }

  expect(getFunctionProperty({ blop: fn }, "blop")).toBe(fn);
  expect(getFunctionProperty({ fn }, "fn")).toBe(fn);
});

test("exactSubsetOrDefault() trims superset keys to subset keys", () => {
  expect(
    exactSubsetOrDefault(
      {
        foo: 1,
        bar: 2,
      },
      { bar: 5 }
    )
  ).toEqual({ bar: 2 });
});

test("exactSubsetOrDefault() returns default if first arg is null", () => {
  expect(exactSubsetOrDefault(null, { bar: 5 })).toEqual({ bar: 5 });
});

test("twoTuple() works", () => {
  expect(twoTuple("blah", 2)).toEqual(["blah", 2]);
});

test("isDeepEqual() works", () => {
  expect(isDeepEqual({ a: 1 }, { a: 1 })).toBe(true);
  expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
});

describe("numberWithCommas() works", () => {
  expect(numberWithCommas(1234)).toBe("1,234");
  expect(numberWithCommas(5.2341)).toBe("5.2341");
});

test("friendlyPhoneNumber() works", () => {
  expect(friendlyPhoneNumber("+15551234567")).toBe("(555) 123-4567");
  expect(friendlyPhoneNumber("5551234567")).toBe("(555) 123-4567");
  expect(friendlyPhoneNumber("blah")).toBe("blah");
});
