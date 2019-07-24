import React from 'react';
import { LabelRenderer, BaseFormFieldProps, TextualFormField, RadiosFormField } from './form-fields';
import { toDjangoChoices } from './common-data';
import { BoroughChoices, getBoroughChoiceLabels } from '../../common-data/borough-choices';
import { ProgressiveEnhancementContext, ProgressiveEnhancement } from './progressive-enhancement';
import { safeGetBoroughChoice } from './pages/onboarding-step-1';
import { GeoAutocomplete } from './geo-autocomplete';

const DEFAULT_ADDRESS_LABEL = "Address";

type AddressAndBoroughFieldProps = {
  disableProgressiveEnhancement?: boolean;
  addressLabel?: string,
  onChange?: () => void;
  renderAddressLabel?: LabelRenderer,
  addressProps: BaseFormFieldProps<string>,
  boroughProps: BaseFormFieldProps<string>
};

export class AddressAndBoroughField extends React.Component<AddressAndBoroughFieldProps> {
  renderBaselineAddressFields(): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField
          label={this.props.addressLabel || DEFAULT_ADDRESS_LABEL}
          renderLabel={this.props.renderAddressLabel}
          {...this.props.addressProps}
        />
        <RadiosFormField
          label="What is your borough?"
          {...this.props.boroughProps}
          choices={toDjangoChoices(BoroughChoices, getBoroughChoiceLabels())}
        />
      </React.Fragment>
    );
  }

  renderEnhancedAddressField(pe: ProgressiveEnhancementContext) {
    const { addressProps, boroughProps } = this.props;
    let initialValue = addressProps.value
      ? { address: addressProps.value,
          borough: safeGetBoroughChoice(boroughProps.value) }
      : undefined;

    if (boroughProps.errors && !addressProps.errors) {
      return this.renderBaselineAddressFields();
    }

    return <GeoAutocomplete
      label={this.props.addressLabel || DEFAULT_ADDRESS_LABEL}
      renderLabel={this.props.renderAddressLabel}
      initialValue={initialValue}
      onChange={selection => {
        this.props.onChange && this.props.onChange();
        addressProps.onChange(selection.address);
        boroughProps.onChange(selection.borough || '');
      }}
      onNetworkError={pe.fallbackToBaseline}
      errors={addressProps.errors}
    />;
  }

  render() {
    return (
      <ProgressiveEnhancement
        disabled={this.props.disableProgressiveEnhancement}
        renderBaseline={() => this.renderBaselineAddressFields()}
        renderEnhanced={(pe) => this.renderEnhancedAddressField(pe)} />
    );
  }
}
