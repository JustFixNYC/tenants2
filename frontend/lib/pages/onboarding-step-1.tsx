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
import { Modal, ModalLink } from '../modal';
import { DjangoChoices, getDjangoChoiceLabel } from '../common-data';
import { TextualFormField, SelectFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { withAppContext, AppContextType } from '../app-context';
import { LogoutMutation } from '../queries/LogoutMutation';
import { bulmaClasses } from '../bulma';

const BOROUGH_CHOICES = require('../../../common-data/borough-choices.json') as DjangoChoices;

const blankInitialState: OnboardingStep1Input = {
  name: '',
  address: '',
  aptNumber: '',
  borough: '',
};

export function areAddressesTheSame(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

export function Step1AddressModal(): JSX.Element {
  return (
    <Modal title="Why do you need my address?" onCloseGoBack render={({close}) => (
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
  const borough = onboardingStep1.borough
    ? getDjangoChoiceLabel(BOROUGH_CHOICES, onboardingStep1.borough)
    : '';

  return (
    <Modal title="Is this your address?" onCloseGoBack render={({close}) => (
      <div className="content box">
        <h1 className="title">Is this your address?</h1>
        <p>{onboardingStep1.address}, {borough}</p>
        <button className="button is-text is-fullwidth" onClick={close}>No, go back.</button>
        <Link to={Routes.onboarding.step2} className="button is-primary is-fullwidth">Yes!</Link>
      </div>
    )} />
  );
});

interface OnboardingStep1State {
  isMounted: boolean;
}

export default class OnboardingStep1 extends React.Component<{}, OnboardingStep1State> {
  readonly cancelControlRef: React.RefObject<HTMLDivElement> = React.createRef();
  readonly state = { isMounted: false };

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control" ref={this.cancelControlRef} />
        <NextButton isLoading={isLoading} />
      </div>
    );
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep1Input>): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField label="What is your full name?" {...ctx.fieldPropsFor('name')} />
        <TextualFormField label="What is your address?" {...ctx.fieldPropsFor('address')} />
        <SelectFormField
          label="What is your borough?"
          {...ctx.fieldPropsFor('borough')}
          choices={BOROUGH_CHOICES}
        />
        <TextualFormField label="What is your apartment number?" {...ctx.fieldPropsFor('aptNumber')} />
        <ModalLink to={Routes.onboarding.step1AddressModal} component={Step1AddressModal} className="is-size-7">
          Why do you need my address?
        </ModalLink>
        <br/>
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
        <React.Fragment>
          {this.state.isMounted && this.cancelControlRef.current
            ? ReactDOM.createPortal(
                <button type="button" onClick={(e) => {
                  e.preventDefault();
                  ctx.submit();
                }} className={bulmaClasses('button', 'is-light', {
                  'is-loading': ctx.isLoading
                })}>Cancel signup</button>,
                this.cancelControlRef.current
              )
            : <button type="submit" className="button is-light">Cancel signup</button>}
        </React.Fragment>
      )}</SessionUpdatingFormSubmitter>
    );
  }

  render() {
    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <p>JustFix.nyc is a nonprofit based in NYC. We're here to help you learn your rights and take action to get repairs in your apartment!</p>
        <br/>
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
