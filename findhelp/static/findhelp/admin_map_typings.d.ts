import { GeoJsonObject } from "geojson";

export interface AdminMapJsonParams {
  mapboxAccessToken: String;
  mapboxTilesOrigin: String;
  zoomLevel: number;
  pointLabelHTML: string | null;
  point: GeoJsonObject | null;
  area: GeoJsonObject | null;
}
