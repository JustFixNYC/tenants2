import React from 'react';
import ReactDOM from 'react-dom';
import Page from '../page';
import Routes, { getSignupIntentRouteInfo } from '../routes';
import { Link, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { OnboardingStep1Mutation } from '../queries/OnboardingStep1Mutation';
import { assertNotNull } from '../util';
import { Modal, BackOrUpOneDirLevel } from '../modal';
import { TextualFormField, RadiosFormField, renderSimpleLabel, LabelRenderer, HiddenFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { withAppContext, AppContextType } from '../app-context';
import { LogoutMutation } from '../queries/LogoutMutation';
import { bulmaClasses } from '../bulma';
import { GeoAutocomplete } from '../geo-autocomplete';
import { getBoroughLabel, BOROUGH_CHOICES, BoroughChoice } from '../boroughs';
import { ProgressiveEnhancement, ProgressiveEnhancementContext } from '../progressive-enhancement';
import { OutboundLink } from '../google-analytics';
import { DEFAULT_SIGNUP_INTENT_CHOICE, validateSignupIntent, SignupIntentChoice } from '../signup-intent';
import { getQuerystringVar } from '../querystring';

const blankInitialState: OnboardingStep1Input = {
  firstName: '',
  lastName: '',
  signupIntent: DEFAULT_SIGNUP_INTENT_CHOICE,
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

export function getIntent(signupIntent: string|undefined , search: string): SignupIntentChoice {
  const defaultIntent = validateSignupIntent(signupIntent);
  return validateSignupIntent(getQuerystringVar(search, 'intent'), defaultIntent);
}

export function areAddressesTheSame(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

export function PrivacyInfoModal(): JSX.Element {
  return (
    <Modal title="Your privacy is very important to us!" onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => (
      <div className="content box">
        <div className="jf-is-scrollable-if-too-tall">
          <h5>Your privacy is very important to us! Here are some important things to know:</h5>
          <ul>
            <li>Your personal information is secure.</li>
            <li>We don’t use your personal information for profit or sell it to third parties.</li>
            <li>We use your address to find information about your landlord and your building.</li>
          </ul>
          <p>
            Our Privacy Policy enables sharing anonymized data with approved tenant advocacy {" "}
            organizations exclusively to help further our tenants rights mission. {" "}
            The Privacy Policy contains information regarding what data we collect, how we use it, {" "}
            and the choices you have regarding your personal information. If you’d like to read {" "}
            more, please review our full {" "}
            <OutboundLink href="https://www.justfix.nyc/privacy-policy" target="_blank">Privacy Policy</OutboundLink> and {" "}
            <OutboundLink href="https://www.justfix.nyc/terms-of-use" target="_blank">Terms of Use</OutboundLink>.
          </p>
        </div>
        <div className="has-text-centered"><Link className="button is-primary is-medium" {...ctx.getLinkCloseProps()}>Got it!</Link></div>
      </div>
    )} />
  );
}

export const ConfirmAddressModal = withAppContext((props: AppContextType): JSX.Element => {
  const onboardingStep1 = props.session.onboardingStep1 || blankInitialState;
  const borough = getBoroughLabel(onboardingStep1.borough) || '';

  return (
    <Modal title="Is this your address?" onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => (
      <div className="content box">
        <h1 className="title">Is this your address?</h1>
        <p>{onboardingStep1.address}, {borough}</p>
        <Link to={Routes.onboarding.step2} className="button is-primary is-fullwidth">Yes!</Link>
        <Link {...ctx.getLinkCloseProps()} className="button is-text is-fullwidth">No, go back.</Link>
      </div>
    )} />
  );
});

type OnboardingStep1Props = {
  disableProgressiveEnhancement?: boolean;
} & RouteComponentProps<any> & AppContextType;

class OnboardingStep1WithoutContexts extends React.Component<OnboardingStep1Props> {
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

    if (boroughProps.errors && !addressProps.errors) {
      return this.renderBaselineAddressFields(ctx);
    }

    return <GeoAutocomplete
      label="Address"
      renderLabel={renderAddressLabel}
      initialValue={initialValue}
      onChange={selection => {
        addressProps.onChange(selection.address);
        boroughProps.onChange(selection.borough || '');
      }}
      onNetworkError={pe.fallbackToBaseline}
      errors={addressProps.errors}
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
        <HiddenFormField {...ctx.fieldPropsFor('signupIntent')} />
        <TextualFormField label="Apartment number" autoComplete="address-line2 street-address" {...ctx.fieldPropsFor('aptNumber')} />
        <Route path={Routes.onboarding.step1AddressModal} exact component={PrivacyInfoModal} />
        <p>
          Your privacy is very important to us! Everything on JustFix.nyc is kept confidential and secure. {" "}
          <Link to={Routes.onboarding.step1AddressModal}>Click here to learn more<span className="jf-sr-only"> about our privacy policy</span></Link>.
        </p>
        <br/>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderHiddenLogoutForm(onSuccessRedirect: string) {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LogoutMutation}
        initialState={{}}
        onSuccessRedirect={onSuccessRedirect}
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
              <button type="button" onClick={ctx.submit} className={bulmaClasses('button', 'is-light', 'is-medium', {
                'is-loading': ctx.isLoading
              })}>Cancel signup</button>,
              this.cancelControlRef.current
            )
          }} />
      )}</SessionUpdatingFormSubmitter>
    );
  }

  render() {
    const input = this.props.session.onboardingStep1 || blankInitialState;
    const signupIntent = getIntent(input.signupIntent, this.props.location.search);
    const initialState: OnboardingStep1Input = { ...input, signupIntent };
    const cancelRoute = getSignupIntentRouteInfo(signupIntent).preOnboarding;

    return (
      <Page title="Create an account to get started with JustFix.nyc!">
        <div>
          <h1 className="title is-4">Create an account to get started with JustFix.nyc!</h1>
            <SessionUpdatingFormSubmitter
              mutation={OnboardingStep1Mutation}
              initialState={initialState}
              onSuccessRedirect={(output, input) => {
                const successSession = assertNotNull(output.session);
                const successInfo = assertNotNull(successSession.onboardingStep1);
                if (areAddressesTheSame(successInfo.address, input.address) &&
                    successInfo.borough === input.borough) {
                  return Routes.onboarding.step2;
                }
                return Routes.onboarding.step1ConfirmAddressModal;
              }}
            >
              {this.renderForm}
            </SessionUpdatingFormSubmitter>
        </div>

        {this.renderHiddenLogoutForm(cancelRoute)}
        <Route path={Routes.onboarding.step1ConfirmAddressModal} exact component={ConfirmAddressModal} />
      </Page>
    );
  }
}

const OnboardingStep1 = withAppContext(withRouter(OnboardingStep1WithoutContexts));

export default OnboardingStep1;
