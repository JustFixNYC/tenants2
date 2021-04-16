import React from "react";

import ReactTestingLibraryPal from "../../tests/rtl-pal";
import Confetti, {
  CONFETTI_WRAPPER_CLASS,
  ensurePointerEventsIsNone,
} from "../confetti";
import { assertNotNull } from "@justfixnyc/util";
import { responsiveInt } from "../../../vendor/confetti";

describe("Confetti", () => {
  it("works", () => {
    jest.useFakeTimers();

    const pal = new ReactTestingLibraryPal(<Confetti />);
    const getWrapper = () =>
      assertNotNull(document.documentElement).querySelector(
        `body > .${CONFETTI_WRAPPER_CLASS}`
      );

    // Make sure that the wrapper is created and has a canvas.
    const wrapper = assertNotNull(getWrapper());
    const canvas = wrapper.querySelector("canvas");

    expect(canvas).not.toBeNull();

    // I'm not really sure if this actually executes any code, but
    // might as well call it just in case it does.
    jest.runAllTimers();

    // Now make sure that when we unmount it, the wrapper is removed too.
    pal.rr.rerender(<div />);

    expect(getWrapper()).toBeNull();
  });
});

describe("ensurePointerEventsIsNone()", () => {
  it("raises error when given an element without pointer-events: none", () => {
    expect(() =>
      ensurePointerEventsIsNone(document.createElement("div"))
    ).toThrow(/pointer-events of element is not "none"/i);
  });

  it("does nothing when given an element with pointer-events: none", () => {
    const div = document.createElement("div");
    div.style.pointerEvents = "none";
    ensurePointerEventsIsNone(div);
  });
});

test("responsiveInt() works", () => {
  expect(responsiveInt(2, 4, 1)).toBe(2);
  expect(responsiveInt(2, 4, 99999)).toBe(4);
  expect(responsiveInt(2, 4, 900)).toBe(3);
});
