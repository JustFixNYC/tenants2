import { GeoJsonObject } from "geojson";

export interface AdminMapJsonParams {
  mapboxAccessToken: String;
  mapboxTilesOrigin: String;
  center: [number, number],
  zoomLevel: number,
  pointLabel: string;
  point: GeoJsonObject|null;
  area: GeoJsonObject|null;
}
