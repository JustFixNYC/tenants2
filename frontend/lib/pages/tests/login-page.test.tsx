import React from "react";
import LoginPage, {
  performHardOrSoftRedirect,
  absolutifyURLToOurOrigin,
  unabsolutifyURLFromOurOrigin,
} from "../login-page";
import { Route } from "react-router";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { setHardRedirector } from "../../hard-redirect";
import {
  setGlobalAppServerInfo,
  getGlobalAppServerInfo,
} from "../../app-context";

test('login page sets "next" input to expected value', () => {
  const pal = new AppTesterPal(<Route component={LoginPage} />, {
    url: "/login?next=/bop",
    server: { originURL: "https://blarg.com" },
  });
  pal.rr.getAllByText(/Sign in/i);
  expect(pal.getElement("input", '[name="next"]').value).toEqual(
    "https://blarg.com/bop"
  );
});

describe("performHardOrSoftRedirect()", () => {
  let hardRedirect = jest.fn();
  const originURL = "http://blarg.com";

  beforeEach(() => {
    hardRedirect = jest.fn();
    setHardRedirector(hardRedirect);
    setGlobalAppServerInfo({
      ...getGlobalAppServerInfo(),
      originURL,
    });
  });

  it("performs a soft redirect when the route is known to be in our SPA", () => {
    const push = jest.fn();
    performHardOrSoftRedirect(`${originURL}/login`, { push } as any);
    expect(hardRedirect.mock.calls.length).toBe(0);
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/login");
  });

  it("performs a hard redirect when the route is on our origin but unknown", () => {
    const push = jest.fn();
    performHardOrSoftRedirect(`${originURL}/loc/letter.pdf`, { push } as any);
    expect(push.mock.calls.length).toBe(0);
    expect(hardRedirect.mock.calls.length).toBe(1);
    expect(hardRedirect.mock.calls[0][0]).toBe(`${originURL}/loc/letter.pdf`);
  });

  it("performs a hard redirect when the route is not on our origin", () => {
    const push = jest.fn();
    performHardOrSoftRedirect(`http://othersite.com/blarg`, { push } as any);
    expect(push.mock.calls.length).toBe(0);
    expect(hardRedirect.mock.calls.length).toBe(1);
    expect(hardRedirect.mock.calls[0][0]).toBe("http://othersite.com/blarg");
  });
});

describe("unabsolutifyURLFromOurOrigin()", () => {
  it("returns null when given URLs outside of our origin", () => {
    expect(
      unabsolutifyURLFromOurOrigin("http://foo.com/hmm", "http://bar.com")
    ).toBe(null);
  });

  it("returns paths when given URLs at our origin", () => {
    expect(
      unabsolutifyURLFromOurOrigin("http://foo.com/hmm", "http://foo.com")
    ).toBe("/hmm");
  });

  it("returns paths when given paths", () => {
    expect(
      unabsolutifyURLFromOurOrigin("/bleerg", "http://foo.com")
    ).toBe("/bleerg");
  });
});

describe("absolutifyURLToOurOrigin()", () => {
  it("passes through valid already-valid URLs", () => {
    expect(
      absolutifyURLToOurOrigin("https://blah.com/bop", "https://blah.com")
    ).toBe("https://blah.com/bop");
  });

  it("prefixes relative URLs with our origin", () => {
    expect(absolutifyURLToOurOrigin("/bop", "https://blah.com")).toBe(
      "https://blah.com/bop"
    );
  });

  it("ensures other weird values supplied by untrusted parties are rooted at our origin", () => {
    expect(absolutifyURLToOurOrigin("//evilsite.com", "https://blah.com")).toBe(
      "https://blah.com//evilsite.com"
    );

    expect(absolutifyURLToOurOrigin("", "https://blah.com")).toBe(
      "https://blah.com/"
    );

    expect(absolutifyURLToOurOrigin("bop", "https://blah.com")).toBe(
      "https://blah.com/bop"
    );

    expect(
      absolutifyURLToOurOrigin(
        "https://blah.cometothisevilsite.com",
        "https://blah.com"
      )
    ).toBe("https://blah.com/https://blah.cometothisevilsite.com");
  });
});
