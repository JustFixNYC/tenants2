import History from "history";
import { NEXT, ROUTE_PREFIX } from "../util/route-util";

/**
 * These routes are only accessible by staff.
 *
 * NOTE: at present every one of these routes needs to also be listed in
 * `project/admin.py`, to ensure that the back-end delegates
 * the rendering of the routes to the React front-end.
 */
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

  directory: "/admin/directory/",

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
