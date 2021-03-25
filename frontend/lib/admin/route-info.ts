import History from "history";
import { NEXT, ROUTE_PREFIX } from "../util/route-util";

export const adminRouteInfo = {
  [ROUTE_PREFIX]: "/admin",

  /**
   * The *admin* login page. We override Django's default admin login
   * here, so we need to make sure this URL matches the URL that Django
   * redirects users to.
   */
  login: "/admin/login/",

  conversations: "/admin/conversations/",

  frontappPlugin: "/admin/frontapp/",

  /**
   * Create an admin login link that redirects the user to the given location
   * after they've logged in.
   */
  createAdminLoginLink(next: History.Location): string {
    return `${this.login}?${NEXT}=${encodeURIComponent(
      next.pathname + next.search
    )}`;
  },
};
