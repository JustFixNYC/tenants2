import { JustfixCrossSiteVisitorRouteInfo } from "./justfix-routes";
import { ProgressStepRoute } from "./progress/progress-step-route";
import { createCrossSiteAgreeToTermsStep } from "./pages/cross-site-terms-opt-in";

export function createJustfixCrossSiteVisitorSteps(
  routes: JustfixCrossSiteVisitorRouteInfo
): ProgressStepRoute[] {
  return [createCrossSiteAgreeToTermsStep(routes.crossSiteAgreeToTerms)];
}
