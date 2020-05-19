import React, { useContext } from "react";
import Page from "../ui/page";
import { MapboxCityAutocomplete } from "../forms/mapbox/city-autocomplete";
import { AppContext } from "../app-context";
import { SimpleProgressiveEnhancement } from "../ui/progressive-enhancement";

const MapboxWidgets: React.FC<{}> = () => {
  return (
    <SimpleProgressiveEnhancement>
      <MapboxCityAutocomplete
        label="What city/township/borough do you live in?"
        onChange={(item) => console.log("onChange", item)}
        onNetworkError={(err) => console.error("onNetworkError", err)}
      />
    </SimpleProgressiveEnhancement>
  );
};

export const ExampleMapboxPage: React.FC<{}> = () => {
  const isMapboxEnabled = !!useContext(AppContext).server.mapboxAccessToken;

  return (
    <Page title="Example Mapbox page" withHeading>
      <div className="content">
        <p>Mapbox integration is {isMapboxEnabled ? "enabled" : "disabled"}.</p>
      </div>
      {isMapboxEnabled && <MapboxWidgets />}
    </Page>
  );
};
