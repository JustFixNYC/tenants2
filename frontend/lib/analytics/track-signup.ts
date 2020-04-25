import { fbq } from "./facebook-pixel";
import { getDataLayer } from "./google-tag-manager";
import { OnboardingInfoSignupIntent } from "../queries/globalTypes";

export function trackSignup(
  signupIntent: OnboardingInfoSignupIntent | null | undefined
) {
  fbq("trackCustom", "NewUserSignup");
  getDataLayer().push({
    event: "jf.signup",
    "jf.signupIntent": signupIntent || null,
  });
}
