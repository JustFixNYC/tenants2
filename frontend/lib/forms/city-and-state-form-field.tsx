import React, { useContext } from "react";
import { BaseFormFieldProps, TextualFormField } from "./form-fields";
import { USStateFormField } from "./mailing-address-fields";
import {
  MapboxCityAutocomplete,
  MapboxCityItem,
} from "./mapbox/city-autocomplete";
import {
  ProgressiveEnhancement,
  ProgressiveEnhancementContext,
} from "../ui/progressive-enhancement";
import { AppContext } from "../app-context";
import {
  USStateChoice,
  isUSStateChoice,
  getUSStateChoiceLabels,
} from "../../../common-data/us-state-choices";

export type CityAndStateFieldProps = {
  cityProps: BaseFormFieldProps<string>;
  stateProps: BaseFormFieldProps<string>;
};

function safeGetUSStateChoice(state: string): USStateChoice | "" {
  if (isUSStateChoice(state)) return state;
  return "";
}

const BaselineField: React.FC<CityAndStateFieldProps> = (props) => (
  <>
    <TextualFormField {...props.cityProps} label="City" />
    <USStateFormField {...props.stateProps} />
  </>
);

const EnhancedField: React.FC<
  CityAndStateFieldProps & { pe: ProgressiveEnhancementContext }
> = (props) => {
  const { cityProps, stateProps } = props;
  const stateCode = safeGetUSStateChoice(stateProps.value);
  const stateName = stateCode ? getUSStateChoiceLabels()[stateCode] : "";
  const initialValue: MapboxCityItem | undefined = cityProps.value
    ? {
        city: cityProps.value,
        mapboxFeature: null,
        stateCode,
        stateName,
      }
    : undefined;

  if (stateProps.errors && !cityProps.errors) {
    return <BaselineField {...props} />;
  }

  return (
    <MapboxCityAutocomplete
      label="What city do you live in?"
      initialValue={initialValue}
      onChange={(item) => {
        cityProps.onChange(item.city);
        stateProps.onChange(item.stateCode);
      }}
      onNetworkError={props.pe.fallbackToBaseline}
      errors={cityProps.errors}
    />
  );
};

export const CityAndStateField: React.FC<CityAndStateFieldProps> = (props) => {
  const isMapboxDisabled = !useContext(AppContext).server.mapboxAccessToken;

  return (
    <ProgressiveEnhancement
      disabled={isMapboxDisabled}
      renderBaseline={() => <BaselineField {...props} />}
      renderEnhanced={(pe) => <EnhancedField {...props} pe={pe} />}
    />
  );
};
