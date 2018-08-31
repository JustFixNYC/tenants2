import React from 'react';
import { OnboardingStep2Input } from "../../queries/globalTypes";
import { GraphQLFetch } from "../../graphql-client";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import Page from '../../page';
import { FormSubmitter, FormContext, CheckboxFormField } from '../../forms';
import autobind from 'autobind-decorator';
import { fetchOnboardingStep2Mutation } from '../../queries/OnboardingStep2Mutation';
import { assertNotNull } from '../../util';
import { Link } from 'react-router-dom';
import Routes from '../../routes';
import { bulmaClasses } from '../../bulma';

const blankInitialState: OnboardingStep2Input = {
  isInEviction: false,
  needsRepairs: false,
  hasNoServices: false,
  hasPests: false,
  hasCalled311: false,
};

export interface OnboardingStep2Props {
  fetch: GraphQLFetch;
  onSuccess: (session: AllSessionInfo) => void;
  initialState?: OnboardingStep2Input|null;
}

export default class OnboardingStep2 extends React.Component<OnboardingStep2Props> {
  @autobind
  handleSubmit(input: OnboardingStep2Input) {
    return fetchOnboardingStep2Mutation(this.props.fetch, { input })
      .then(result => result.onboardingStep2);
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep2Input>): JSX.Element {
    return (
      <React.Fragment>
        <CheckboxFormField {...ctx.fieldPropsFor('isInEviction')}>
          I received an eviction notice.
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('needsRepairs')}>
          I need repairs made in my apartment.
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('hasNoServices')}>
          I'm living without essential services (heat/gas/hot water).
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('hasPests')}>
          I have pests (rodents, cockroaches, bed bugs).
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('hasCalled311')}>
          I've called 311 before to report these issues.
        </CheckboxFormField>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control">
          <Link to={Routes.onboarding.step1} className="button is-text">Back</Link>
        </div>
        <div className="control">
          <button type="submit" className={bulmaClasses('button', 'is-primary', {
            'is-loading': isLoading
          })}>Next</button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Page title="What type of housing issues are you experiencing?">
        <h1 className="title">What type of housing issues are you experiencing?</h1>
        <FormSubmitter
          onSubmit={this.handleSubmit}
          initialState={this.props.initialState || blankInitialState}
          onSuccessRedirect={Routes.onboarding.step3}
          onSuccess={(output) => this.props.onSuccess(assertNotNull(output.session))}
        >{this.renderForm}</FormSubmitter>
      </Page>
    );
  }
}
