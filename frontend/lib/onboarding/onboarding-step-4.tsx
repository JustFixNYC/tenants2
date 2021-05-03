import React, { useRef } from "react";
import {
  OnboardingInfoSignupIntent,
  OnboardingStep4Version2Input as OnboardingStep4Input,
} from "../queries/globalTypes";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import autobind from "autobind-decorator";
import { OnboardingRouteInfo } from "./route-info";
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
  BlankOnboardingStep4Version2Input as BlankOnboardingStep4Input,
  OnboardingStep4Version2Mutation,
} from "../queries/OnboardingStep4Version2Mutation";
import { trackSignup } from "../analytics/track-signup";
import { Link } from "react-router-dom";
import JustfixRoutes from "../justfix-route-info";
import { useAutoFocus } from "../ui/use-auto-focus";
import { OnboardingStep4WithOptionalEmailMutation } from "../queries/OnboardingStep4WithOptionalEmailMutation";
import { optionalizeLabelIf } from "../forms/optionalize-label";
import { CreatePasswordFields } from "../common-steps/create-password";

type OnboardingStep4Props = {
  routes: OnboardingRouteInfo;
  toSuccess: string;
  signupIntent: OnboardingInfoSignupIntent;
};

type OnboardingStep4Mutation =
  | typeof OnboardingStep4Version2Mutation
  | typeof OnboardingStep4WithOptionalEmailMutation;

function isEmailOptionalForIntent(value: OnboardingInfoSignupIntent): boolean {
  if (value === "EHP") {
    return false;
  }
  return true;
}

function getMutationForIntent(
  value: OnboardingInfoSignupIntent
): OnboardingStep4Mutation {
  return isEmailOptionalForIntent(value)
    ? OnboardingStep4WithOptionalEmailMutation
    : OnboardingStep4Version2Mutation;
}

const ExistingAccountNotification: React.FC<{}> = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useAutoFocus(ref, true);

  return (
    <div className="notification is-info" ref={ref} tabIndex={-1}>
      <h2 className="subtitle">You may already have a JustFix.nyc account.</h2>
      <p>
        If you remember your password, you can{" "}
        <Link to={JustfixRoutes.locale.login}>sign into your account</Link>.
      </p>
      <br />
      <p>
        If you're not sure if you have an account, or if you've forgotten your
        password, you can{" "}
        <Link to={JustfixRoutes.locale.passwordReset.start}>
          try resetting your password
        </Link>
        .
      </p>
    </div>
  );
};

export default class OnboardingStep4 extends React.Component<
  OnboardingStep4Props
> {
  private readonly blankInitialState: OnboardingStep4Input = {
    ...BlankOnboardingStep4Input,
    canWeSms: true,
    signupIntent: this.props.signupIntent,
  };

  @autobind
  renderForm(ctx: FormContext<OnboardingStep4Input>): JSX.Element {
    const { routes, signupIntent } = this.props;

    const isPhoneNumberTaken = ctx
      .fieldPropsFor("phoneNumber")
      .errors?.some((err) => err.code === "PHONE_NUMBER_TAKEN");
    const isEmailTaken = ctx
      .fieldPropsFor("email")
      .errors?.some((err) => err.code === "EMAIL_ADDRESS_TAKEN");

    return (
      <React.Fragment>
        {(isPhoneNumberTaken || isEmailTaken) && (
          <ExistingAccountNotification />
        )}
        <PhoneNumberFormField
          label="Phone number"
          {...ctx.fieldPropsFor("phoneNumber")}
        />
        <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
          Yes, JustFix.nyc can text me to follow up about my housing issues.
        </CheckboxFormField>
        <TextualFormField
          label={optionalizeLabelIf(
            "Email address",
            isEmailOptionalForIntent(signupIntent)
          )}
          type="email"
          {...ctx.fieldPropsFor("email")}
        />
        <HiddenFormField {...ctx.fieldPropsFor("signupIntent")} />
        <br />
        <CreatePasswordFields />

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
            mutation={getMutationForIntent(this.props.signupIntent)}
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
