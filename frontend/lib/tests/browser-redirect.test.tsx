import {
  performHardOrSoftRedirect,
  absolutifyURLToOurOrigin,
  unabsolutifyURLFromOurOrigin,
  setHardRedirector,
} from "../browser-redirect";
import { overrideGlobalAppServerInfo } from "./util";

describe("performHardOrSoftRedirect()", () => {
  let hardRedirect = jest.fn();
  const originURL = "http://blarg.com";

  beforeEach(() => {
    hardRedirect = jest.fn();
    setHardRedirector(hardRedirect);
    overrideGlobalAppServerInfo({ originURL, siteType: "JUSTFIX" });
  });

  it("performs a soft redirect when the absolute URL is known to be in our SPA", () => {
    const push = jest.fn();
    performHardOrSoftRedirect(`${originURL}/en/login`, { push } as any);
    expect(hardRedirect.mock.calls.length).toBe(0);
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/en/login");
  });

  it("takes into account the current site", () => {
    const norentUrl = `${originURL}/en/letter`;
    const push = jest.fn();

    // JustFix should perform a hard redirect b/c it doesn't know
    // about this NoRent-specific URL.
    overrideGlobalAppServerInfo({ originURL, siteType: "JUSTFIX" });
    performHardOrSoftRedirect(norentUrl, { push } as any);
    expect(push.mock.calls.length).toBe(0);
    expect(hardRedirect.mock.calls.length).toBe(1);
    expect(hardRedirect.mock.calls[0][0]).toBe(`${originURL}/en/letter`);

    push.mockClear();
    hardRedirect.mockClear();

    // NoRent should perform a soft redirect because it knows about
    // this NoRent-specific URL.
    overrideGlobalAppServerInfo({ originURL, siteType: "NORENT" });
    performHardOrSoftRedirect(norentUrl, { push } as any);
    expect(hardRedirect.mock.calls.length).toBe(0);
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/en/letter");
  });

  it("performs a soft redirect when the relative URL is known to be in our SPA", () => {
    const push = jest.fn();
    performHardOrSoftRedirect("/en/login", { push } as any);
    expect(hardRedirect.mock.calls.length).toBe(0);
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/en/login");
  });

  it("performs a hard redirect when the route is on our origin but unknown", () => {
    const push = jest.fn();
    performHardOrSoftRedirect(`${originURL}/en/loc/finished-letter.pdf`, {
      push,
    } as any);
    expect(push.mock.calls.length).toBe(0);
    expect(hardRedirect.mock.calls.length).toBe(1);
    expect(hardRedirect.mock.calls[0][0]).toBe(
      `${originURL}/en/loc/finished-letter.pdf`
    );
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
    expect(unabsolutifyURLFromOurOrigin("/bleerg", "http://foo.com")).toBe(
      "/bleerg"
    );
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
