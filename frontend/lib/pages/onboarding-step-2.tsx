import React from 'react';
import { OnboardingStep2Input } from "../queries/globalTypes";
import Page from '../page';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import autobind from 'autobind-decorator';
import { Modal, BackOrUpOneDirLevel } from '../modal';
import AlertableCheckbox from '../alertable-checkbox';
import { ProgressButtons } from "../buttons";
import { IconLink } from "../icon";
import { CheckboxFormField } from '../form-fields';
import { OnboardingStep2Mutation, BlankOnboardingStep2Input } from '../queries/OnboardingStep2Mutation';
import { OutboundLink } from '../google-analytics';
import { Link } from 'react-router-dom';
import { glueToLastWord } from '../word-glue';
import { OnboardingRouteInfo } from '../routes';
import { FormContext } from '../form-context';
import { CenteredButtons } from '../centered-buttons';


export function Step2EvictionModal(): JSX.Element {
  return (
    <Modal title="Eviction cases are currently halted" withHeading onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => <>
      <p>
        If you have been given an eviction notice, that is currently illegal. 
        An Eviction Moratorium is currently in place across New York State due to the COVID-19 crisis.
      </p>
      <CenteredButtons>
        <OutboundLink href="https://www.righttocounselnyc.org/moratorium_faq" className="button is-primary is-medium">Learn more</OutboundLink>
        <Link className="button is-text" {...ctx.getLinkCloseProps()}>Continue with letter</Link>
      </CenteredButtons>
    </>} />
  );
}

type OnboardingStep2Props = {
  routes: OnboardingRouteInfo;
};

export default class OnboardingStep2 extends React.Component<OnboardingStep2Props> {
  @autobind
  renderForm(ctx: FormContext<OnboardingStep2Input>): JSX.Element {
    const { routes } = this.props;

    return (
      <React.Fragment>
        <AlertableCheckbox modal={Step2EvictionModal}
                           modalPath={routes.step2EvictionModal}
                           {...ctx.fieldPropsFor('isInEviction')}>
          {glueToLastWord(
            'I received an eviction notice.',
            <IconLink
              type="warning"
              to={routes.step2EvictionModal}
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
        <ProgressButtons back={this.props.routes.step1} isLoading={ctx.isLoading} />
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title="What type of housing issues are you experiencing?">
        <div>
          <h1 className="title is-4 is-spaced">What issues are you experiencing?</h1>
          <p className="subtitle is-6">Please select <strong>all that applies</strong> to your housing situation. You can add more details later on.</p>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep2Mutation}
            initialState={(session) => session.onboardingStep2 || BlankOnboardingStep2Input}
            onSuccessRedirect={this.props.routes.step3}
          >{this.renderForm}</SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}
