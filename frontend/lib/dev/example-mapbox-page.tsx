import React, { useContext } from "react";
import Page from "../ui/page";
import { MapboxCityAutocomplete } from "../forms/mapbox-autocomplete";
import { AppContext } from "../app-context";
import { SimpleProgressiveEnhancement } from "../ui/progressive-enhancement";

export const ExampleMapboxPage: React.FC<{}> = () => {
  const isMapboxEnabled = !!useContext(AppContext).server.mapboxAccessToken;

  return (
    <Page title="Example Mapbox page" withHeading>
      <div className="content">
        <p>Mapbox integration is {isMapboxEnabled ? "enabled" : "disabled"}.</p>
      </div>
      <SimpleProgressiveEnhancement>
        <MapboxCityAutocomplete
          label="What city do you live in?"
          onChange={(item) => {
            console.log("CHANGE", item);
          }}
          onNetworkError={(err) => {
            console.error("ERROR", err);
          }}
        />
      </SimpleProgressiveEnhancement>
    </Page>
  );
};
