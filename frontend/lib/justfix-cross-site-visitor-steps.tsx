import { ProgressStepRoute } from "./progress/progress-step-route";
import { createCrossSiteAgreeToTermsStep } from "./pages/cross-site-terms-opt-in";
import { JustfixCrossSiteVisitorRouteInfo } from "./justfix-cross-site-visitor-routes";

export function createJustfixCrossSiteVisitorSteps(
  routes: JustfixCrossSiteVisitorRouteInfo
): ProgressStepRoute[] {
  return [createCrossSiteAgreeToTermsStep(routes.crossSiteAgreeToTerms)];
}
