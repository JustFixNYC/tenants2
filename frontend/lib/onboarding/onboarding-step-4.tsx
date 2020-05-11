import React from "react";
import {
  OnboardingInfoSignupIntent,
  OnboardingStep4Version2Input,
} from "../queries/globalTypes";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import autobind from "autobind-decorator";
import { OnboardingRouteInfo } from "../justfix-routes";
import { ProgressButtons } from "../ui/buttons";
import {
  CheckboxFormField,
  TextualFormField,
  HiddenFormField,
} from "../forms/form-fields";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { ModalLink } from "../ui/modal";
import { PrivacyInfoModal } from "../ui/privacy-info-modal";
import { FormContext } from "../forms/form-context";
import {
  BlankOnboardingStep4Version2Input,
  OnboardingStep4Version2Mutation,
} from "../queries/OnboardingStep4Version2Mutation";
import { trackSignup } from "../analytics/track-signup";

type OnboardingStep4Props = {
  routes: OnboardingRouteInfo;
  toSuccess: string;
  signupIntent: OnboardingInfoSignupIntent;
};

export default class OnboardingStep4 extends React.Component<
  OnboardingStep4Props
> {
  private readonly blankInitialState: OnboardingStep4Version2Input = {
    ...BlankOnboardingStep4Version2Input,
    canWeSms: true,
    signupIntent: this.props.signupIntent,
  };

  @autobind
  renderForm(ctx: FormContext<OnboardingStep4Version2Input>): JSX.Element {
    const { routes } = this.props;

    return (
      <React.Fragment>
        <PhoneNumberFormField
          label="Phone number"
          {...ctx.fieldPropsFor("phoneNumber")}
        />
        <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
          Yes, JustFix.nyc can text me to follow up about my housing issues.
        </CheckboxFormField>
        <TextualFormField
          label="Email address"
          type="email"
          {...ctx.fieldPropsFor("email")}
        />
        <HiddenFormField {...ctx.fieldPropsFor("signupIntent")} />
        <br />
        <TextualFormField
          label="Create a password"
          type="password"
          {...ctx.fieldPropsFor("password")}
        />
        <TextualFormField
          label="Please confirm your password"
          type="password"
          {...ctx.fieldPropsFor("confirmPassword")}
        />
        <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
          I agree to the{" "}
          <ModalLink
            to={routes.step4TermsModal}
            render={() => <PrivacyInfoModal />}
          >
            JustFix.nyc terms and conditions
          </ModalLink>
          .
        </CheckboxFormField>
        <ProgressButtons
          back={routes.step3}
          isLoading={ctx.isLoading}
          nextLabel="Continue"
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title="Contact information">
        <div>
          <h1 className="title is-4">Your contact information</h1>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep4Version2Mutation}
            initialState={this.blankInitialState}
            onSuccessRedirect={this.props.toSuccess}
            onSuccess={(output) =>
              trackSignup(output.session?.onboardingInfo?.signupIntent)
            }
          >
            {this.renderForm}
          </SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}
