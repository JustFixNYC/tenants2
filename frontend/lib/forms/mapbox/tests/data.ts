import _BROOKLYN from "./brooklyn.json";
import _SAN_JUAN from "./san-juan.json";
import { MapboxFeature, MapboxResults } from "../common.js";

export const BROOKLYN_MAPBOX_FEATURE = _BROOKLYN as MapboxFeature;

export const SAN_JUAN_MAPBOX_FEATURE = _SAN_JUAN as MapboxFeature;

export const BROOKLYN_MAPBOX_RESULTS: MapboxResults = {
  type: "FeatureCollection",
  query: ["brooklyn"],
  features: [BROOKLYN_MAPBOX_FEATURE],
  attribution: "mapbox",
};
