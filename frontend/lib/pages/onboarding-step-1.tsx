import React from 'react';
import Page from '../page';
import { bulmaClasses } from '../bulma';
import Routes from '../routes';
import { Link, Route } from 'react-router-dom';
import { TextualFormField, FormSubmitter, FormContext } from '../forms';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { fetchOnboardingStep1Mutation } from '../queries/OnboardingStep1Mutation';
import { GraphQLFetch } from '../graphql-client';
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { assertNotNull } from '../util';
import { Modal, ModalLink } from '../modal';


const blankInitialState: OnboardingStep1Input = {
  name: '',
  address: '',
  aptNumber: ''
};

interface OnboardingStep1Props {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  initialState?: OnboardingStep1Input|null;
}

export function Step1AddressModal(): JSX.Element {
  return (
    <Modal title="Why do you need to know my address?" onCloseGoBack>
      <div className="content box">Because something something.</div>
    </Modal>
  );
}

export default class OnboardingStep1 extends React.Component<OnboardingStep1Props> {
  @autobind
  handleSubmit(input: OnboardingStep1Input) {
    return fetchOnboardingStep1Mutation(this.props.fetch, { input })
      .then(result => result.onboardingStep1);
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep1Input>): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField label="What is your name?" {...ctx.fieldPropsFor('name')} />
        <TextualFormField label="What is your address?" {...ctx.fieldPropsFor('address')} />
        <TextualFormField label="What is your apartment number?" {...ctx.fieldPropsFor('aptNumber')} />
        <div className="field is-grouped">
          <div className="control">
            <Link to={Routes.home} className="button is-text">Cancel</Link>
          </div>
          <div className="control">
            <button type="submit" className={bulmaClasses('button', 'is-primary', {
              'is-loading': ctx.isLoading
            })}>Next</button>
          </div>
        </div>
        <ModalLink to={Routes.onboarding.step1AddressModal} component={Step1AddressModal}>
          Why do you need to know my address?
        </ModalLink>
      </React.Fragment>
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
                       onSuccessRedirect={Routes.onboarding.step2}
                       onSuccess={(output) => { assertNotNull(output.session) && this.props.onSuccess(output.session); }}>
          {this.renderForm}
        </FormSubmitter>
      </Page>
    );
  }
}
