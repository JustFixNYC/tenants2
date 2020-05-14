import React from "react";
import {
  ariaBool,
  AriaExpandableButton,
  AriaExpandableButtonProps,
  AriaAnnouncer,
  AriaAnnouncement,
  AriaAnnouncementWithoutContext,
} from "../aria";
import ReactTestingLibraryPal from "../../tests/rtl-pal";

test("ariaBool() works", () => {
  expect(ariaBool(true)).toBe("true");
  expect(ariaBool(false)).toBe("false");
});

const KEYS: { [name: string]: number } = {
  enter: 13,
  space: 32,
  esc: 27,
  a: 65,
};

function getKeyCode(name: string): number {
  const number = KEYS[name];
  if (typeof number !== "number") {
    throw new Error(`"${name}" is not a valid key name`);
  }
  return number;
}

describe("AriaExpandableButton", () => {
  let props: AriaExpandableButtonProps;
  let onToggle: jest.Mock;

  beforeEach(() => {
    onToggle = jest.fn();
    props = {
      isExpanded: false,
      children: "boop",
      onToggle,
    };
  });

  it("renders children and toggles on click", () => {
    const pal = new ReactTestingLibraryPal(<AriaExpandableButton {...props} />);
    pal.clickButtonOrLink("boop");
    expect(onToggle.mock.calls.length).toBe(1);
  });

  const makeAndClickBtn = (keyName: string) => {
    const pal = new ReactTestingLibraryPal(<AriaExpandableButton {...props} />);
    const btn = pal.getElement("a", '[role="button"]');
    const wasDefaultPrevented = !pal.rt.fireEvent.keyDown(btn, {
      keyCode: getKeyCode(keyName),
    });
    return wasDefaultPrevented;
  };

  ["enter", "space"].forEach((name) => {
    it(`toggles on key press of ${name}`, () => {
      const wasDefaultPrevented = makeAndClickBtn(name);
      expect(onToggle.mock.calls.length).toBe(1);
      expect(wasDefaultPrevented).toBe(true);
    });
  });

  ["esc", "a"].forEach((name) => {
    it(`does not toggle on key press of ${name}`, () => {
      const wasDefaultPrevented = makeAndClickBtn(name);
      expect(onToggle.mock.calls.length).toBe(0);
      expect(wasDefaultPrevented).toBe(false);
    });
  });

  it('sets aria-expanded="false"', () => {
    const pal = new ReactTestingLibraryPal(
      <AriaExpandableButton {...props} isExpanded={false} />
    );
    expect(pal.getElement("a").getAttribute("aria-expanded")).toBe("false");
  });

  it('sets aria-expanded="true"', () => {
    const pal = new ReactTestingLibraryPal(
      <AriaExpandableButton {...props} isExpanded={true} />
    );
    expect(pal.getElement("a").getAttribute("aria-expanded")).toBe("true");
  });
});

describe("AriaAnnouncer", () => {
  it("sets its text to the text of descendant announcements", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <AriaAnnouncer>
          <AriaAnnouncement text="oh hai" />
        </AriaAnnouncer>
      )
    );

    expect(pal.getElement("div", '[aria-live="polite"]').innerHTML).toContain(
      "oh hai"
    );
  });
});

describe("AriaAnnouncement", () => {
  const AriaAnnouncement = AriaAnnouncementWithoutContext;

  it("calls announce on mount and again when text changes", () => {
    const announce = jest.fn();
    const pal = new ReactTestingLibraryPal(
      <AriaAnnouncement announce={announce} text="boop" />
    );
    expect(announce.mock.calls).toHaveLength(1);

    pal.rr.rerender(<AriaAnnouncement announce={announce} text="boop" />);
    expect(announce.mock.calls).toHaveLength(1);

    pal.rr.rerender(<AriaAnnouncement announce={announce} text="blop" />);
    expect(announce.mock.calls).toHaveLength(2);
  });
});
