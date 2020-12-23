export type JustfixCrossSiteVisitorRouteInfo = ReturnType<
  typeof createJustfixCrossSiteVisitorRoutes
>;

export function createJustfixCrossSiteVisitorRoutes(prefix: string) {
  return {
    crossSiteAgreeToTerms: `${prefix}/terms`,
  };
}
