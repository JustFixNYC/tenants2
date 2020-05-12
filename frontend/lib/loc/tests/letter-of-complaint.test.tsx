import { getLOCProgressRoutesProps } from "../letter-of-complaint";
import JustfixRoutes from "../../justfix-routes";
import { ProgressRoutesTester } from "../../progress/tests/progress-routes-tester";

const tester = new ProgressRoutesTester(
  getLOCProgressRoutesProps(),
  "letter of complaint"
);

tester.defineSmokeTests();

describe("latest step redirector", () => {
  it("returns splash page by default", () => {
    expect(tester.getLatestStep()).toBe(JustfixRoutes.locale.loc.splash);
  });

  it("returns welcome if user is logged in", () => {
    expect(
      tester.getLatestStep({
        phoneNumber: "5551234567",
      })
    ).toBe(JustfixRoutes.locale.loc.welcome);
  });

  it("returns confirmation page if letter request has been submitted", () => {
    expect(
      tester.getLatestStep({
        letterRequest: {} as any,
      })
    ).toBe(JustfixRoutes.locale.loc.confirmation);
  });
});
