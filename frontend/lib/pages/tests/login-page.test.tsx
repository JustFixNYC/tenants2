import React from "react";
import LoginPage, {
  performHardOrSoftRedirect,
  absolutifyURLToOurOrigin,
} from "../login-page";
import { Route } from "react-router";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { setHardRedirector } from "../../hard-redirect";

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

  beforeEach(() => {
    hardRedirect = jest.fn();
    setHardRedirector(hardRedirect);
  });

  it("performs a soft redirect when the route is known to be in our SPA", () => {
    const push = jest.fn();
    performHardOrSoftRedirect("/login", { push } as any);
    expect(hardRedirect.mock.calls.length).toBe(0);
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/login");
  });

  it("performs a hard redirect when the route is unknown", () => {
    const push = jest.fn();
    performHardOrSoftRedirect("/loc/letter.pdf", { push } as any);
    expect(push.mock.calls.length).toBe(0);
    expect(hardRedirect.mock.calls.length).toBe(1);
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
