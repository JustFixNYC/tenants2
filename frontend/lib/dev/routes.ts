import { ROUTE_PREFIX } from "../util/route-util";

export type DevRouteInfo = ReturnType<typeof createDevRouteInfo>;

export function createDevRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    home: `${prefix}/`,
    styleGuide: `${prefix}/style-guide`,
    examples: {
      [ROUTE_PREFIX]: `${prefix}/examples`,
      ddo: `${prefix}/examples/ddo`,
      redirect: `${prefix}/examples/redirect`,
      modal: `${prefix}/examples/modal`,
      loadingPage: `${prefix}/examples/loading-page`,
      form: `${prefix}/examples/form`,
      formInModal: `${prefix}/examples/form/in-modal`,
      formWithoutRedirect: `${prefix}/examples/form2`,
      formInModalWithoutRedirect: `${prefix}/examples/form2/in-modal`,
      mapbox: `${prefix}/examples/mapbox`,
      radio: `${prefix}/examples/radio`,
      loadable: `${prefix}/examples/loadable-page`,
      clientSideError: `${prefix}/examples/client-side-error`,
      metaTag: `${prefix}/examples/meta-tag`,
      query: `${prefix}/examples/query`,
      anchors1: `${prefix}/examples/anchors/one`,
      anchors2: `${prefix}/examples/anchors/two`,
      staticPage: `${prefix}/examples/static-page`,
      staticPagePdf: `${prefix}/examples/static-page.pdf`,
      staticPageTxt: `${prefix}/examples/static-page.txt`,
      staticResponsiveHtmlEmail: `${prefix}/examples/static-html-email`,
      intl: `${prefix}/examples/intl`,
    },
  };
}
