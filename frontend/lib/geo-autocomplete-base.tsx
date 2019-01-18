/**
 * For documentation about this endpoint, see:
 *
 * https://geosearch.planninglabs.nyc/docs/#autocomplete
 */
const GEO_AUTOCOMPLETE_URL = 'https://geosearch.planninglabs.nyc/v1/autocomplete';

/**
 * The keys here were obtained experimentally, I'm not actually sure
 * if/where they are formally specified.
 */
export enum GeoSearchBoroughGid {
  Manhattan = 'whosonfirst:borough:1',
  Bronx = 'whosonfirst:borough:2',
  Brooklyn = 'whosonfirst:borough:3',
  Queens = 'whosonfirst:borough:4',
  StatenIsland = 'whosonfirst:borough:5',
}

export interface GeoSearchProperties {
  /** e.g. "Brooklyn" */
  borough: string;

  /** e.g. "whosonfirst:borough:2" */
  borough_gid: GeoSearchBoroughGid;

  /** e.g. "150" */
  housenumber: string;

  /** e.g. "150 COURT STREET" */
  name: string;

  /** e.g. "150 COURT STREET, Brooklyn, New York, NY, USA" */
  label: string;
}

export interface GeoSearchResults {
  bbox: unknown;
  features: {
    geometry: unknown;
    properties: GeoSearchProperties
  }[];
}

export interface GeoSearchRequesterOptions {
  createAbortController: () => AbortController|undefined;
  fetch: typeof window.fetch,
  throttleMs: number,
  onError: (e: Error) => void;
  onResults: (results: GeoSearchResults) => void;
}

export class GeoSearchRequester {
  private requestId: number;
  private abortController?: AbortController;
  private throttleTimeout: number|null;

  constructor(readonly options: GeoSearchRequesterOptions) {
    this.requestId = 0;
    this.abortController = options.createAbortController();
    this.throttleTimeout = null;
  }

  private async fetchResults(value: string): Promise<GeoSearchResults|null> {
    const originalRequestId = this.requestId;
    const url = `${GEO_AUTOCOMPLETE_URL}?text=${encodeURIComponent(value)}`;
    let results: GeoSearchResults;

    // It's important that we pull fetch out as its own variable,
    // as this will bind its "this" context to the global scope
    // when it's called, which is important for most/all window.fetch()
    // implementations.
    const { fetch } = this.options;

    try {
      const res = await fetch(url, {
        signal: this.abortController && this.abortController.signal
      });
      results = await res.json();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // Don't worry about it, the user just aborted the request.
        return null;
      } else {
        throw e;
      }
    }
    if (this.requestId === originalRequestId) {
      return results;
    }
    return null;
  }

  private resetSearchRequest() {
    if (this.throttleTimeout !== null) {
      window.clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = this.options.createAbortController();
    }
    this.requestId++;
  }

  changeSearchRequest(value: string): boolean {
    this.resetSearchRequest();
    if (value.length > 0) {
      this.throttleTimeout = window.setTimeout(() => {
        this.fetchResults(value).catch(this.options.onError).then(results => {
          if (results) {
            this.options.onResults(results);
          }
        });
      }, this.options.throttleMs);
      return true;
    }
    return false;
  }

  shutdown() {
    this.resetSearchRequest();
  }
}
