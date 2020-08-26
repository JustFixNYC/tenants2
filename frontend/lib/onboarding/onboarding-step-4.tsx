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
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

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
          label={li18n._(t`Phone number`)}
          {...ctx.fieldPropsFor("phoneNumber")}
        />
        <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
          <Trans>
            Yes, JustFix.nyc can text me to follow up about my housing issues.
          </Trans>
        </CheckboxFormField>
        <TextualFormField
          label={li18n._(t`Email address`)}
          type="email"
          {...ctx.fieldPropsFor("email")}
        />
        <HiddenFormField {...ctx.fieldPropsFor("signupIntent")} />
        <br />
        <TextualFormField
          label={li18n._(t`Create a password`)}
          type="password"
          {...ctx.fieldPropsFor("password")}
        />
        <TextualFormField
          label={li18n._(t`Please confirm your password`)}
          type="password"
          {...ctx.fieldPropsFor("confirmPassword")}
        />
        <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
          <Trans>
            I agree to the{" "}
            <ModalLink
              to={routes.step4TermsModal}
              render={() => <PrivacyInfoModal />}
            >
              JustFix.nyc terms and conditions
            </ModalLink>
            .
          </Trans>
        </CheckboxFormField>
        <ProgressButtons
          back={routes.step3}
          isLoading={ctx.isLoading}
          nextLabel={li18n._(t`Continue`)}
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title={li18n._(t`Your contact information`)} withHeading>
        <div>
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
