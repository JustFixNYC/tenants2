import { AppTesterPal } from "../../../tests/app-tester-pal";
import { createProgressStepJSX } from "../../../progress/tests/progress-step-test-util";
import { NorentLbWelcome } from "../welcome";
import { LogoutMutation } from "../../../queries/LogoutMutation";
import { BlankAllSessionInfo } from "../../../queries/AllSessionInfo";

describe("NoRent welcome page", () => {
  const createPal = (phoneNumber?: string) => {
    return new AppTesterPal(createProgressStepJSX(NorentLbWelcome), {
      session: {
        phoneNumber: phoneNumber,
      },
    });
  };

  it("should work", async () => {
    const pal = createPal();
    pal.rr.getByText("Build your letter");
    pal.clickButtonOrLink("Next");
    await pal.rt.waitFor(() => pal.rr.getByText("Your phone number"));
  });

  it("should show special welcome message for logged-in users", () => {
    const pal = createPal("1234567890");
    pal.rr.getByText("Welcome back!");
  });

  it("should clear the user's session when Cancel button is clicked", async () => {
    const pal = createPal("1234567890");
    pal.clickButtonOrLink("Cancel");
    pal.withFormMutation(LogoutMutation).respondWithSuccess({
      session: { ...BlankAllSessionInfo },
    });
    await pal.rt.waitFor(() => pal.rr.getByText("Can't pay rent?"));
  });
});
