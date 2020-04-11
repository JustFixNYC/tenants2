import { matchPath } from 'react-router-dom';

/**
 * Special route key indicating the prefix of a set of routes,
 * rather than a route that necessarily leads somewhere.
 */
export const ROUTE_PREFIX = 'prefix';

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

export function isParameterizedRoute(path: string): boolean {
  return path.indexOf(':') !== -1;
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

  constructor(private readonly routes: any) {
  }

  private ensureIsInitialized() {
    if (!this.isInitialized) {
      this.populate(this.routes);
      this.isInitialized = true;
    }
  }

  private populate(routes: any) {
    Object.keys(routes).forEach(name => {
      const value = routes[name];
      if (typeof(value) === 'string' && name !== ROUTE_PREFIX) {
        if (isParameterizedRoute(value)) {
          this.parameterizedRoutes.push(value);
        } else {
          this.existenceMap.set(value, true);
        }
      } else if (value && typeof(value) === 'object') {
        this.populate(value);
      }
    });
  }

  get size(): number {
    this.ensureIsInitialized();
    return this.existenceMap.size + this.parameterizedRoutes.length;
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
