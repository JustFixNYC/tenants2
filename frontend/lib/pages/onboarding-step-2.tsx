import React from 'react';
import { OnboardingStep2Input } from "../queries/globalTypes";
import Page from '../page';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import autobind from 'autobind-decorator';
import Routes from '../routes';
import { Modal, BackOrUpOneDirLevel } from '../modal';
import AlertableCheckbox from '../alertable-checkbox';
import { NextButton, BackButton } from "../buttons";
import { IconLink } from "../icon-link";
import { CheckboxFormField } from '../form-fields';
import { OnboardingStep2Mutation } from '../queries/OnboardingStep2Mutation';
import { OutboundLink } from '../google-analytics';
import { Link } from 'react-router-dom';
import { glueToLastWord } from '../word-glue';


const blankInitialState: OnboardingStep2Input = {
  isInEviction: false,
  needsRepairs: false,
  hasNoServices: false,
  hasPests: false,
  hasCalled311: false,
};

export function Step2EvictionModal(): JSX.Element {
  return (
    <Modal title="You need legal help" onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => (
      <div className="content box">
        <h1 className="title">You need legal help</h1>
        <p>
          If you're in an eviction, it's important to try to get legal help right away.
        </p>
        <p>
          Eviction Free NYC is a website where you can learn how to respond to an eviction and connect with legal support.
        </p>
        <OutboundLink href="https://www.evictionfreenyc.org/en-US/" className="button is-primary is-fullwidth">Go to Eviction Free NYC</OutboundLink>
        <Link className="button is-text is-fullwidth" {...ctx.getLinkCloseProps()}>Continue with letter</Link>
      </div>
    )} />
  );
}

export default class OnboardingStep2 extends React.Component {
  @autobind
  renderForm(ctx: FormContext<OnboardingStep2Input>): JSX.Element {
    return (
      <React.Fragment>
        <AlertableCheckbox modal={Step2EvictionModal}
                           modalPath={Routes.onboarding.step2EvictionModal}
                           {...ctx.fieldPropsFor('isInEviction')}>
          {glueToLastWord(
            'I received an eviction notice.',
            <IconLink
              type="warning"
              to={Routes.onboarding.step2EvictionModal}
              title="If you are in an eviction, you need legal help."
            />
          )}
        </AlertableCheckbox>
        <CheckboxFormField {...ctx.fieldPropsFor('needsRepairs')}>
          I need repairs made in my apartment/building.
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('hasNoServices')}>
          I'm living without essential services (heat, gas, hot water).
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('hasPests')}>
          I have pests (rodents, cockroaches, bed bugs).
        </CheckboxFormField>
        <CheckboxFormField {...ctx.fieldPropsFor('hasCalled311')}>
          I've already called 311 but nothing has changed.
        </CheckboxFormField>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="buttons jf-two-buttons">
        <BackButton to={Routes.onboarding.step1} label="Back" />
        <NextButton isLoading={isLoading} />
      </div>
    );
  }

  render() {
    return (
      <Page title="What type of housing issues are you experiencing?">
        <div className="box">
          <h1 className="title">What are you experiencing?</h1>
          <p>Please select <strong>all that applies</strong> to your housing situation. You can add more details later on.</p>
          <br/>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep2Mutation}
            initialState={(session) => session.onboardingStep2 || blankInitialState}
            onSuccessRedirect={Routes.onboarding.step3}
          >{this.renderForm}</SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}
