import i18n from "../../i18n";
import {
  logAmplitudeFormSubmission,
  _forTestingAmplitude as amp,
} from "../amplitude";

function makeAmplitudeMock() {
  const instance = {
    logEvent: jest.fn(),
  };

  return {
    getInstance: () => instance,
    ...instance,
  };
}

let amplitude = makeAmplitudeMock();

beforeEach(() => {
  i18n.initialize("en");
  amplitude = makeAmplitudeMock();
  (window as any).amplitude = amplitude;
});

describe("unlocalizePathname() works", () => {
  const { unlocalizePathname } = amp;

  it("unlocalizes paths of the current locale", () => {
    expect(unlocalizePathname("/en/blarg")).toBe("/blarg");

    i18n.initialize("es");
    expect(unlocalizePathname("/es/blarg")).toBe("/blarg");
  });

  it("does not unlocalize paths of the not-current locale", () => {
    expect(unlocalizePathname("/es/blarg")).toBe("/es/blarg");
  });
});

test("getPageInfo() works", () => {
  expect(amp.getPageInfo("/en/blarg")).toEqual({
    pathname: "/blarg",
    locale: "en",
    siteType: "JUSTFIX",
  });
});

describe("logAmplitudeFormSubmission()", () => {
  it("works with successful form submissions", () => {
    logAmplitudeFormSubmission({
      pathname: "/en/boop",
      formKind: "MyFunkyMutation",
    });
    expect(amplitude.logEvent).toHaveBeenCalledWith(
      "Submitted form successfully",
      {
        errorCodes: undefined,
        errorMessages: undefined,
        formId: undefined,
        formKind: "MyFunkyMutation",
        locale: "en",
        pathname: "/boop",
        redirect: undefined,
        search: undefined,
        siteType: "JUSTFIX",
      }
    );
  });

  it("works with unsuccessful form submissions", () => {
    logAmplitudeFormSubmission({
      pathname: "/en/boop",
      formKind: "MyFunkyMutation",
      errors: [
        {
          field: "foo",
          extendedMessages: [
            { message: "You gotta provide this value!", code: "required" },
          ],
        },
      ],
    });
    expect(amplitude.logEvent).toHaveBeenCalledWith(
      "Submitted form with errors",
      {
        errorCodes: ["foo: required"],
        errorMessages: ["foo: You gotta provide this value!"],
        formId: undefined,
        formKind: "MyFunkyMutation",
        locale: "en",
        pathname: "/boop",
        redirect: undefined,
        search: undefined,
        siteType: "JUSTFIX",
      }
    );
  });
});
