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
