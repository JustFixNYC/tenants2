import { AppTesterPal } from "../../../tests/app-tester-pal";
import { NorentLbKnowYourRights } from "../know-your-rights";
import { override } from "../../../tests/util";
import { BlankNorentScaffolding } from "../../../queries/NorentScaffolding";
import { createProgressStepJSX } from "../../../progress/tests/progress-step-test-util";

describe("<NorentLbKnowYourRights>", () => {
  afterEach(AppTesterPal.cleanup);

  const createPal = (state: string) => {
    return new AppTesterPal(createProgressStepJSX(NorentLbKnowYourRights), {
      session: {
        norentScaffolding: override(BlankNorentScaffolding, {
          state,
        }),
      },
    });
  };

  it("shows KYR info for states w/ protections", () => {
    const pal = createPal("NY");
    pal.rr.getByText(/support once you’ve sent your letter/i);
  });

  it("dissuades user for states w/o protections", () => {
    const pal = createPal("GA");
    pal.rr.getByText(/unfortunately.+we do not currently recommend/i);
  });
});
