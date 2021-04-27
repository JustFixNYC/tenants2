import React from "react";
import {
  LabelRenderer,
  BaseFormFieldProps,
  TextualFormField,
  RadiosFormField,
  HiddenFormField,
} from "./form-fields";
import { toDjangoChoices } from "../common-data";
import {
  BoroughChoices,
  getBoroughChoiceLabels,
  isBoroughChoice,
  BoroughChoice,
} from "../../../common-data/borough-choices";
import {
  ProgressiveEnhancementContext,
  ProgressiveEnhancement,
} from "../ui/progressive-enhancement";
import { GeoAutocomplete } from "./geo-autocomplete";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

const getDefaultAddressLabel = () => li18n._(t`Address`);

type AddressAndBoroughFieldProps = {
  disableProgressiveEnhancement?: boolean;
  addressLabel?: string;
  hideBoroughField?: boolean;
  onChange?: () => void;
  renderAddressLabel?: LabelRenderer;
  addressProps: BaseFormFieldProps<string>;
  boroughProps: BaseFormFieldProps<string>;
  autoFocus?: boolean;
};

function safeGetBoroughChoice(choice: string): BoroughChoice | null {
  if (isBoroughChoice(choice)) return choice;
  return null;
}

export class AddressAndBoroughField extends React.Component<
  AddressAndBoroughFieldProps
> {
  renderBaselineAddressFields(): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField
          autoFocus={this.props.autoFocus}
          label={this.props.addressLabel || getDefaultAddressLabel()}
          renderLabel={this.props.renderAddressLabel}
          {...this.props.addressProps}
        />
        {this.props.hideBoroughField ? (
          <HiddenFormField {...this.props.boroughProps} />
        ) : (
          <RadiosFormField
            label={li18n._(t`What is your borough?`)}
            {...this.props.boroughProps}
            choices={toDjangoChoices(BoroughChoices, getBoroughChoiceLabels())}
          />
        )}
      </React.Fragment>
    );
  }

  renderEnhancedAddressField(pe: ProgressiveEnhancementContext) {
    const { addressProps, boroughProps } = this.props;
    let initialValue = addressProps.value
      ? {
          address: addressProps.value,
          borough: safeGetBoroughChoice(boroughProps.value),
        }
      : undefined;

    if (boroughProps.errors && !addressProps.errors) {
      return this.renderBaselineAddressFields();
    }

    return (
      <GeoAutocomplete
        label={this.props.addressLabel || getDefaultAddressLabel()}
        renderLabel={this.props.renderAddressLabel}
        initialValue={initialValue}
        autoFocus={this.props.autoFocus}
        onChange={(selection) => {
          this.props.onChange && this.props.onChange();
          addressProps.onChange(selection.address);
          boroughProps.onChange(selection.borough || "");
        }}
        onNetworkError={pe.fallbackToBaseline}
        errors={addressProps.errors}
      />
    );
  }

  render() {
    return (
      <ProgressiveEnhancement
        disabled={this.props.disableProgressiveEnhancement}
        renderBaseline={() => this.renderBaselineAddressFields()}
        renderEnhanced={(pe) => this.renderEnhancedAddressField(pe)}
      />
    );
  }
}
