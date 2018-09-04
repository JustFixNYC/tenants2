import React from 'react';
import Page from '../page';
import { bulmaClasses } from '../bulma';
import Routes from '../routes';
import { Link, Redirect } from 'react-router-dom';
import { FormSubmitter, FormContext } from '../forms';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { fetchOnboardingStep1Mutation } from '../queries/OnboardingStep1Mutation';
import { GraphQLFetch } from '../graphql-client';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { assertNotNull } from '../util';
import { Modal, ModalLink } from '../modal';
import { DjangoChoices, getDjangoChoiceLabel } from '../common-data';
import { TextualFormField, SelectFormField } from '../form-fields';

const BOROUGH_CHOICES = require('../../../common-data/borough-choices.json') as DjangoChoices;

const blankInitialState: OnboardingStep1Input = {
  name: '',
  address: '',
  aptNumber: '',
  borough: '',
};

export interface OnboardingStep1Props {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  onCancel: () => void;
  initialState?: OnboardingStep1Input|null;
}

interface OnboardingStep1State {
  successSession?: AllSessionInfo;
}

export function NextButton(props: { isLoading: boolean, label?: string }) {
  return (
    <div className="control">
      <button type="submit" className={bulmaClasses('button', 'is-primary', {
        'is-loading': props.isLoading
      })}>{props.label || 'Next'}</button>
    </div>
  );
}

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

export default class OnboardingStep1 extends React.Component<OnboardingStep1Props, OnboardingStep1State> {
  constructor(props: OnboardingStep1Props) {
    super(props);
    this.state = {};
  }

  @autobind
  handleSubmit(input: OnboardingStep1Input) {
    return fetchOnboardingStep1Mutation(this.props.fetch, { input })
      .then(result => result.onboardingStep1);
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control">
          <Link to={Routes.home} className="button is-text" onClick={this.props.onCancel}>Cancel</Link>
        </div>
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
        {this.renderFormButtons(ctx.isLoading)}
        <ModalLink to={Routes.onboarding.step1AddressModal} component={Step1AddressModal} className="is-size-7">
          Why do you need my address?
        </ModalLink>
        {this.state.successSession && this.renderSuccessModalOrRedirect(this.state.successSession, ctx.fieldPropsFor('address').value)}
      </React.Fragment>
    );
  }

  renderSuccessModalOrRedirect(successSession: AllSessionInfo, enteredAddress: string): JSX.Element {
    const finalStep1 = assertNotNull(successSession.onboardingStep1);
    const nextStep = Routes.onboarding.step2;

    if (areAddressesTheSame(finalStep1.address, enteredAddress)) {
      return <Redirect push to={nextStep} />;
    }

    const handleClose = () => {
      this.setState({ successSession: undefined });
    };

    return (
      <Modal title="Is this your address?" onClose={handleClose} render={({close}) => (
        <div className="content box">
          <h1 className="title">Is this your address?</h1>
          <p>{finalStep1.address}, {getDjangoChoiceLabel(BOROUGH_CHOICES, finalStep1.borough)}</p>
          <button className="button is-text is-fullwidth" onClick={close}>No, go back.</button>
          <Link to={nextStep} className="button is-primary is-fullwidth">Yes!</Link>
        </div>
      )} />
    );
  }

  render() {
    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <p>JustFix.nyc is a nonprofit based in NYC. We're here to help you learn your rights and take action to get repairs in your apartment!</p>
        <br/>
        <FormSubmitter onSubmit={this.handleSubmit}
                       initialState={this.props.initialState || blankInitialState}
                       onSuccess={(output) => {
                         const successSession = assertNotNull(output.session);
                         this.props.onSuccess(successSession);
                         this.setState({ successSession })
                       }}>
          {this.renderForm}
        </FormSubmitter>
      </Page>
    );
  }
}
