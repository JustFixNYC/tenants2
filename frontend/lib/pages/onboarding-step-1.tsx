import React from 'react';
import ReactDOM from 'react-dom';
import Page from '../page';
import Routes from '../routes';
import { Link, Route } from 'react-router-dom';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { OnboardingStep1Mutation } from '../queries/OnboardingStep1Mutation';
import { assertNotNull } from '../util';
import { Modal } from '../modal';
import { TextualFormField, RadiosFormField, renderSimpleLabel, LabelRenderer } from '../form-fields';
import { NextButton } from '../buttons';
import { withAppContext, AppContextType } from '../app-context';
import { LogoutMutation } from '../queries/LogoutMutation';
import { bulmaClasses } from '../bulma';
import { GeoAutocomplete } from '../geo-autocomplete';
import { getBoroughLabel, BOROUGH_CHOICES, BoroughChoice } from '../boroughs';
import { ProgressiveEnhancement, ProgressiveEnhancementContext } from '../progressive-enhancement';

const blankInitialState: OnboardingStep1Input = {
  firstName: '',
  lastName: '',
  address: '',
  aptNumber: '',
  borough: '',
};

const renderAddressLabel: LabelRenderer = (label, labelProps) => (
  <div className="level is-marginless is-mobile">
    <div className="level-left">
      <div className="level-item is-marginless">
        {renderSimpleLabel(label, labelProps)}
      </div>
    </div>
    <div className="level-right">
      <div className="level-item is-marginless">
        <Link to={Routes.onboarding.step1AddressModal} className="is-size-7">Why do you need my address?</Link>
      </div>
    </div>
  </div>
);

export function areAddressesTheSame(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

export function Step1AddressModal(): JSX.Element {
  return (
    <Modal title="Your privacy is very important to us!" onCloseGoBack render={({close}) => (
      <div className="content box">
        <h1 className="title">Your privacy is very important to us!</h1>
        <p>
          {`We use your address to find information about your
            building and landlord. We use open data provided from
            the following New York City and State agencies: 
            HPD, DHCR, DOF, DOB and DCP.`}
        </p>
        <button className="button is-primary" onClick={close}>Got it!</button>
      </div>
    )} />
  );
}

export const ConfirmAddressModal = withAppContext((props: AppContextType): JSX.Element => {
  const onboardingStep1 = props.session.onboardingStep1 || blankInitialState;
  const borough = getBoroughLabel(onboardingStep1.borough) || '';

  return (
    <Modal title="Is this your address?" onCloseGoBack render={({close}) => (
      <div className="content box">
        <h1 className="title">Is this your address?</h1>
        <p>{onboardingStep1.address}, {borough}</p>
        <Link to={Routes.onboarding.step2} className="button is-primary is-fullwidth">Yes!</Link>
        <button className="button is-text is-fullwidth" onClick={close}>No, go back.</button>
      </div>
    )} />
  );
});

interface OnboardingStep1Props {
  disableProgressiveEnhancement?: boolean;
}

export default class OnboardingStep1 extends React.Component<OnboardingStep1Props> {
  readonly cancelControlRef: React.RefObject<HTMLDivElement> = React.createRef();

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped jf-two-buttons">
        <div className="control" ref={this.cancelControlRef} />
        <div className="control">
          <NextButton isLoading={isLoading} />
        </div>
      </div>
    );
  }

  renderBaselineAddressFields(ctx: FormContext<OnboardingStep1Input>): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField
          label="Address"
          renderLabel={renderAddressLabel}
          {...ctx.fieldPropsFor('address')}
        />
        <RadiosFormField
          label="What is your borough?"
          {...ctx.fieldPropsFor('borough')}
          choices={BOROUGH_CHOICES}
        />
      </React.Fragment>
    );
  }

  renderEnhancedAddressField(ctx: FormContext<OnboardingStep1Input>, pe: ProgressiveEnhancementContext) {
    const addressProps = ctx.fieldPropsFor('address');
    const boroughProps = ctx.fieldPropsFor('borough');
    let initialValue = addressProps.value && boroughProps.value
      ? { address: addressProps.value,
          borough: boroughProps.value as BoroughChoice }
      : undefined;

    return <GeoAutocomplete
      label="Address"
      renderLabel={renderAddressLabel}
      initialValue={initialValue}
      onChange={selection => {
        addressProps.onChange(selection.address);
        boroughProps.onChange(selection.borough);
      }}
      onNetworkError={pe.fallbackToBaseline}
      errors={addressProps.errors || boroughProps.errors}
    />;
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep1Input>): JSX.Element {
    return (
      <React.Fragment>
        <div className="columns is-mobile">
          <div className="column">
            <TextualFormField label="First name" {...ctx.fieldPropsFor('firstName')} />
          </div>
          <div className="column">
            <TextualFormField label="Last name" {...ctx.fieldPropsFor('lastName')} />
          </div>
        </div>
        <ProgressiveEnhancement
          disabled={this.props.disableProgressiveEnhancement}
          renderBaseline={() => this.renderBaselineAddressFields(ctx)}
          renderEnhanced={(pe) => this.renderEnhancedAddressField(ctx, pe)} />
        <TextualFormField label="Apartment number" {...ctx.fieldPropsFor('aptNumber')} />
        <Route path={Routes.onboarding.step1AddressModal} exact component={Step1AddressModal} />
        <p>
          Your privacy is very important to us! {" "}
          <Link to={Routes.onboarding.step1AddressModal}>Click here to learn more<span className="jf-sr-only"> about our privacy policy</span></Link>.
        </p>
        <br/>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderHiddenLogoutForm() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LogoutMutation}
        initialState={{}}
        onSuccessRedirect={Routes.home}
      >{(ctx) => (
        // If onboarding is explicitly cancelled, we want to flush the
        // user's session to preserve their privacy, so that any
        // sensitive data they've entered is removed from their browser.
        // Since it's assumed they're not logged in anyways, we can do
        // this by "logging out", which also clears all session data.
        //
        // This is complicated by the fact that we want the cancel
        // button to appear as though it's in the main form, while
        // actually submitting a completely different form. HTML5
        // supports this via the <button> element's "form" attribute,
        // but not all browsers support that, so we'll do something
        // a bit clever/kludgy here to work around that.
        <ProgressiveEnhancement
          disabled={this.props.disableProgressiveEnhancement}
          renderBaseline={() => <button type="submit" className="button is-light">Cancel signup</button>}
          renderEnhanced={() => {
            if (!this.cancelControlRef.current) throw new Error('cancelControlRef must exist!');
            return ReactDOM.createPortal(
              <button type="button" onClick={ctx.submit} className={bulmaClasses('button', 'is-light', {
                'is-loading': ctx.isLoading
              })}>Cancel signup</button>,
              this.cancelControlRef.current
            )
          }} />
      )}</SessionUpdatingFormSubmitter>
    );
  }

  render() {
    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <SessionUpdatingFormSubmitter
          mutation={OnboardingStep1Mutation}
          initialState={(session) => session.onboardingStep1 || blankInitialState}
          onSuccessRedirect={(output, input) => {
            const successSession = assertNotNull(output.session);
            const successInfo = assertNotNull(successSession.onboardingStep1);
            if (areAddressesTheSame(successInfo.address, input.address)) {
              return Routes.onboarding.step2;
            }
            return Routes.onboarding.step1ConfirmAddressModal;
          }}
        >
          {this.renderForm}
        </SessionUpdatingFormSubmitter>
        {this.renderHiddenLogoutForm()}
        <Route path={Routes.onboarding.step1ConfirmAddressModal} exact component={ConfirmAddressModal} />
      </Page>
    );
  }
}
