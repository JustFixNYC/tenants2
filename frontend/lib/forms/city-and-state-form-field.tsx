import React, { useContext } from "react";
import { BaseFormFieldProps, TextualFormField } from "./form-fields";
import { USStateFormField } from "./mailing-address-fields";
import {
  MapboxCityAutocomplete,
  MapboxCityItem,
  MapboxCityOptions,
} from "./mapbox/city-autocomplete";
import {
  ProgressiveEnhancement,
  ProgressiveEnhancementContext,
} from "../ui/progressive-enhancement";
import { AppContext } from "../app-context";
import {
  USStateChoice,
  isUSStateChoice,
} from "../../../common-data/us-state-choices";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

export type CityAndStateFieldProps = {
  cityProps: BaseFormFieldProps<string>;
  stateProps: BaseFormFieldProps<string>;
} & MapboxCityOptions;

function safeGetUSStateChoice(state: string): USStateChoice | null {
  if (isUSStateChoice(state)) return state;
  return null;
}

const getCityLabel = () => li18n._(t`City/township/borough`);

const BaselineField: React.FC<CityAndStateFieldProps> = (props) => (
  <>
    <TextualFormField {...props.cityProps} label={getCityLabel()} />
    <USStateFormField
      {...props.stateProps}
      stateChoices={props.forState ? [props.forState] : undefined}
    />
  </>
);

const EnhancedField: React.FC<
  CityAndStateFieldProps & { pe: ProgressiveEnhancementContext }
> = (props) => {
  const { cityProps, stateProps } = props;
  const initialValue: MapboxCityItem | undefined = cityProps.value
    ? {
        city: cityProps.value,
        mapboxFeature: null,
        stateChoice: safeGetUSStateChoice(stateProps.value),
      }
    : undefined;

  if (stateProps.errors && !cityProps.errors) {
    return <BaselineField {...props} />;
  }

  return (
    <MapboxCityAutocomplete
      forState={props.forState}
      bbox={props.bbox}
      label={getCityLabel()}
      initialValue={initialValue}
      onChange={(item) => {
        cityProps.onChange(item.city);
        stateProps.onChange(item.stateChoice || "");
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
