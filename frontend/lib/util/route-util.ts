import { matchPath } from "react-router-dom";
import i18n, { makeLocalePathPrefix } from "../i18n";
import { LocaleChoice } from "../../../common-data/locale-choices";

/**
 * Special route key indicating the prefix of a set of routes,
 * rather than a route that necessarily leads somewhere.
 */
export const ROUTE_PREFIX = "prefix";

/**
 * Returns if any of the arguments represents a route that
 * primarily presents the user with a modal.
 */
export function isModalRoute(...paths: string[]): boolean {
  for (let path of paths) {
    if (/-modal/.test(path)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns whether the route represents a static page.
 * For more details, see the `<StaticPage>` component.
 */
export function isStaticPageRoute(path: string): boolean {
  return /\.(txt|html|pdf)$/.test(path);
}

/**
 * Returns if the route has parameters. For example, in `/article/:id`,
 * `id` is a parameter.
 */
export function isParameterizedRoute(path: string): boolean {
  return path.indexOf(":") !== -1;
}

/**
 * A class that keeps track of what routes actually exist,
 * because apparently React Router is unable to do this
 * for us.
 */
export class RouteMap {
  private existenceMap: Map<string, boolean> = new Map();
  private parameterizedRoutes: string[] = [];
  private isInitialized = false;

  constructor(private readonly routes: any) {}

  private ensureIsInitialized() {
    if (!this.isInitialized) {
      this.populate(this.routes);
      this.isInitialized = true;
    }
  }

  private populate(routes: any) {
    Object.keys(routes).forEach((name) => {
      const value = routes[name];
      if (typeof value === "string" && name !== ROUTE_PREFIX) {
        if (isParameterizedRoute(value)) {
          this.parameterizedRoutes.push(value);
        } else {
          this.existenceMap.set(value, true);
        }
      } else if (
        value &&
        typeof value === "object" &&
        !(value instanceof RouteMap)
      ) {
        this.populate(value);
      }
    });
  }

  get size(): number {
    this.ensureIsInitialized();
    return this.existenceMap.size + this.parameterizedRoutes.length;
  }

  /** Clear all cached route information. Useful if the routes change. */
  clearCache() {
    this.isInitialized = false;
    this.existenceMap.clear();
    this.parameterizedRoutes.splice(0);
  }

  /**
   * Return an iterator that yields all routes that don't have parameters.
   */
  nonParameterizedRoutes(): IterableIterator<string> {
    this.ensureIsInitialized();
    return this.existenceMap.keys();
  }

  /**
   * Given a concrete pathname, returns whether a route for it will
   * potentially match.
   *
   * Note that it doesn't validate that route parameters are necessarily
   * valid beyond their syntactic structure, e.g. passing
   * `/objects/200` to this method may return true, but in reality there
   * may be no object with id "200". Such cases are for route handlers
   * further down the view heirarchy to resolve.
   */
  exists(pathname: string): boolean {
    this.ensureIsInitialized();
    if (this.existenceMap.has(pathname)) {
      return true;
    }
    for (let route of this.parameterizedRoutes) {
      const match = matchPath(pathname, { path: route });
      if (match && match.isExact) {
        return true;
      }
    }
    return false;
  }
}

/**
 * This is an ad-hoc structure that defines URL routes for an app or website.
 *
 * The 'locale' property always returns routes that are prefixed by the
 * currently-selected locale, while other properties represent routes
 * that aren't localized.
 */
export type RouteInfo<
  LocalizedRoutes,
  NonLocalizedRoutes
> = NonLocalizedRoutes & {
  /** Localized routes for the user's currently-selected locale. */
  locale: LocalizedRoutes;

  /** Return localized routes for a different locale. */
  getLocale: (locale: LocaleChoice) => LocalizedRoutes;

  /** A utility object for querying information about routes. */
  routeMap: RouteMap;
};

/**
 * Given a factory function that creates localized routes for a particular
 * locale prefix, and information about non-localized routes, returns route
 * information about the whole site.
 */
export function createRoutesForSite<LocalizedRoutes, NonLocalizedRoutes>(
  createLocalizedRouteInfo: (localePathPrefix: string) => LocalizedRoutes,
  nonLocalizedRouteInfo: NonLocalizedRoutes
): RouteInfo<LocalizedRoutes, NonLocalizedRoutes> {
  let currentLocaleRoutes: LocalizedRoutes | null = null;

  const baseRoutes: RouteInfo<LocalizedRoutes, NonLocalizedRoutes> = {
    get locale(): LocalizedRoutes {
      if (currentLocaleRoutes === null) {
        currentLocaleRoutes = createLocalizedRouteInfo(i18n.localePathPrefix);
      }
      return currentLocaleRoutes;
    },
    getLocale: (locale) =>
      createLocalizedRouteInfo(makeLocalePathPrefix(locale)),
    ...nonLocalizedRouteInfo,

    // This is a placeholder, we're about to replace it with something valid.
    routeMap: null as any,
  };

  baseRoutes.routeMap = new RouteMap(baseRoutes);

  // Note that this can technically create a memory leak, but we won't be making
  // many of these obects and they'll last the lifetime of the application, so it's ok.
  i18n.addChangeListener(() => {
    currentLocaleRoutes = null;
    baseRoutes.routeMap.clearCache();
  });

  return baseRoutes;
}
