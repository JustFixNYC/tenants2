import React from "react";
import { handleOutboundLinkClick, OutboundLink } from "../../ui/outbound-link";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { setHardRedirector } from "../../browser-redirect";

describe("OutboundLink", () => {
  const gaMock = jest.fn();
  const hardRedirect = jest.fn();
  const callHitCallback = () => {
    gaMock.mock.calls[0][5].hitCallback();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    window.ga = gaMock;
    setHardRedirector(hardRedirect);
    gaMock.mockReset();
    hardRedirect.mockReset();
  });

  it("sends hit to GA on click and then redirects", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink href="https://boop.com/" target={undefined}>
          boop
        </OutboundLink>
      )
    );
    const wasDefaultPrevented = !pal.clickButtonOrLink("boop");
    expect(gaMock.mock.calls).toHaveLength(1);
    expect(gaMock.mock.calls[0].slice(0, 5)).toEqual([
      "send",
      "event",
      "outbound",
      "click",
      "https://boop.com/",
    ]);
    expect(wasDefaultPrevented).toBe(true);

    jest.advanceTimersByTime(400);
    expect(hardRedirect.mock.calls).toHaveLength(0);
    callHitCallback();
    expect(hardRedirect.mock.calls).toEqual([["https://boop.com/"]]);
  });

  it('does not prevent default if "target" prop is set', () => {
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink href="https://bap.com/" target="_blank">
          bap
        </OutboundLink>
      )
    );
    const wasDefaultPrevented = !pal.clickButtonOrLink("bap");
    expect(gaMock.mock.calls).toEqual([
      ["send", "event", "outbound", "click", "https://bap.com/"],
    ]);
    expect(hardRedirect.mock.calls).toHaveLength(0);
    expect(wasDefaultPrevented).toBe(false);
  });

  it("redirects after a timeout if GA has not responded", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink href="https://blorp.com/" target={undefined}>
          blorp
        </OutboundLink>
      )
    );
    pal.clickButtonOrLink("blorp");
    jest.advanceTimersByTime(1001);
    expect(hardRedirect.mock.calls).toEqual([["https://blorp.com/"]]);
  });

  it("prevents default click behavior when using GA", () => {
    const preventDefault = jest.fn();
    const e = { currentTarget: { href: "blah" }, preventDefault } as any;
    handleOutboundLinkClick(e);
    expect(gaMock.mock.calls).toHaveLength(1);
    expect(preventDefault.mock.calls).toHaveLength(1);
  });

  it("sends GA event but does not prevent default when a modifier key is pressed", () => {
    const preventDefault = jest.fn();
    const e = {
      shiftKey: true,
      preventDefault,
      currentTarget: { href: "http://boop" },
    } as any;
    handleOutboundLinkClick(e);
    expect(gaMock.mock.calls).toEqual([
      ["send", "event", "outbound", "click", "http://boop"],
    ]);
    expect(preventDefault.mock.calls).toHaveLength(0);
  });

  it("calls onClick prop if passed", () => {
    const onClick = jest.fn();
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink href="https://boop.com/" onClick={onClick}>
          boop
        </OutboundLink>
      )
    );
    pal.clickButtonOrLink("boop");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('Sets default values for "target" and "rel" props', () => {
    const pal = new ReactTestingLibraryPal(
      <OutboundLink href="https://bap.com/">bap</OutboundLink>
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
  it("Doesn't override user value for 'target' but still inserts default 'rel' prop", () => {
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink href="https://bap.com/" target="boop">
          bap
        </OutboundLink>
      )
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
  it('Allows "target" and "rel" props to be set to empty strings', () => {
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink href="https://bap.com/" target="" rel="">
          bap
        </OutboundLink>
      )
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
  it('Allows "target" and "rel" props to be set to undefined', () => {
    const pal = new ReactTestingLibraryPal(
      (
        <OutboundLink
          href="https://bap.com/"
          target={undefined}
          rel={undefined}
        >
          bap
        </OutboundLink>
      )
    );
    expect(pal.rr.container).toMatchSnapshot();
  });
});
