import React, { useContext } from "react";
import Page from "../ui/page";
import { OnboardingRouteInfo } from "./route-info";
import { Link, Route, RouteComponentProps, withRouter } from "react-router-dom";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  OnboardingStep1Input,
  OnboardingInfoSignupIntent,
} from "../queries/globalTypes";
import autobind from "autobind-decorator";
import {
  OnboardingStep1Mutation,
  BlankOnboardingStep1Input,
} from "../queries/OnboardingStep1Mutation";
import { exactSubsetOrDefault } from "../util/util";
import { assertNotNull } from "@justfixnyc/util";
import {
  TextualFormField,
  defaultLabelRenderer,
  LabelRenderer,
} from "../forms/form-fields";
import { NextButton } from "../ui/buttons";
import { withAppContext, AppContextType, AppContext } from "../app-context";
import { FormContext } from "../forms/form-context";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import {
  ConfirmAddressModal,
  redirectToAddressConfirmationOrNextStep,
} from "../ui/address-confirmation";
import { ClearAnonymousSessionButton } from "../forms/clear-anonymous-session-button";
import { updateAddressFromBrowserStorage } from "../browser-storage";
import { getSignupIntentLabels } from "../../../common-data/signup-intent-choices";
import { PrivacyInfoModal } from "../ui/privacy-info-modal";
import {
  createAptNumberFormInput,
  AptNumberFormFields,
} from "../forms/apt-number-form-fields";
import { OutboundLink } from "../ui/outbound-link";

function createAddressLabeler(toStep1AddressModal: string): LabelRenderer {
  return (label, labelProps) => (
    <div className="level is-marginless is-mobile">
      <div className="level-left">
        <div className="level-item is-marginless">
          {defaultLabelRenderer(label, labelProps)}
        </div>
      </div>
      <div className="level-right">
        <div className="level-item is-marginless">
          <Link to={toStep1AddressModal} className="is-size-7">
            Why do you need my address?
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step1ConfirmAddressModal(props: { toStep3: string }): JSX.Element {
  const addrInfo =
    useContext(AppContext).session.onboardingStep1 || BlankOnboardingStep1Input;
  return <ConfirmAddressModal nextStep={props.toStep3} {...addrInfo} />;
}

const ReferralInfo: React.FC<{}> = () => {
  const { session } = useContext(AppContext);

  if (session.activePartnerReferral) {
    const { name, website } = session.activePartnerReferral;
    return (
      <>
        <br />
        <p className="is-size-7">
          <strong>Note:</strong> your information will also be shared with our
          partner organization{" "}
          <OutboundLink href={website}>{name}</OutboundLink>. If you don't want
          this, you can click the "Cancel" button above and start this process
          over.
        </p>
      </>
    );
  }

  return null;
};

type OnboardingStep1Props = {
  disableProgressiveEnhancement?: boolean;
  routes: OnboardingRouteInfo;
  toCancel: string;
  signupIntent: OnboardingInfoSignupIntent;
} & RouteComponentProps<any> &
  AppContextType;

class OnboardingStep1WithoutContexts extends React.Component<
  OnboardingStep1Props
> {
  readonly cancelControlRef: React.RefObject<
    HTMLDivElement
  > = React.createRef();
  private readonly renderAddressLabel = createAddressLabeler(
    this.props.routes.step1AddressModal
  );

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

  @autobind
  renderForm(ctx: FormContext<OnboardingStep1Input>): JSX.Element {
    const { routes } = this.props;

    return (
      <React.Fragment>
        <div className="columns is-mobile">
          <div className="column">
            <TextualFormField
              label="Legal first name"
              {...ctx.fieldPropsFor("firstName")}
            />
          </div>
          <div className="column">
            <TextualFormField
              label="Legal last name"
              {...ctx.fieldPropsFor("lastName")}
            />
          </div>
          <div className="column">
            <TextualFormField
              label="Preferred first name"
              {...ctx.fieldPropsFor("preferredFirstName")}
            />
          </div>
        </div>
        <AddressAndBoroughField
          disableProgressiveEnhancement={
            this.props.disableProgressiveEnhancement
          }
          renderAddressLabel={this.renderAddressLabel}
          addressProps={ctx.fieldPropsFor("address")}
          boroughProps={ctx.fieldPropsFor("borough")}
        />
        <AptNumberFormFields
          aptNumberProps={ctx.fieldPropsFor("aptNumber")}
          noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
        />
        <Route
          path={routes.step1AddressModal}
          exact
          component={PrivacyInfoModal}
        />
        <p>
          Your privacy is very important to us! Everything on JustFix.nyc is
          secure.{" "}
          <Link to={routes.step1AddressModal}>
            Click here to learn more
            <span className="jf-sr-only"> about our privacy policy</span>
          </Link>
          .
        </p>
        <br />
        {this.renderFormButtons(ctx.isLoading)}
        <ReferralInfo />
      </React.Fragment>
    );
  }

  render() {
    const { routes } = this.props;
    const actionLabel = getSignupIntentLabels()[this.props.signupIntent];

    return (
      <Page
        title={`Create an account to get started with your ${actionLabel}!`}
        withHeading
      >
        <div>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep1Mutation}
            initialState={(s) =>
              exactSubsetOrDefault(
                s.onboardingStep1
                  ? {
                      ...s.onboardingStep1,
                      ...createAptNumberFormInput(s.onboardingStep1.aptNumber),
                    }
                  : null,
                BlankOnboardingStep1Input
              )
            }
            updateInitialStateInBrowser={updateAddressFromBrowserStorage}
            onSuccessRedirect={(output, input) =>
              redirectToAddressConfirmationOrNextStep({
                input,
                resolved: assertNotNull(
                  assertNotNull(output.session).onboardingStep1
                ),
                nextStep: routes.step3,
                confirmation: routes.step1ConfirmAddressModal,
              })
            }
          >
            {this.renderForm}
          </SessionUpdatingFormSubmitter>
        </div>

        <ClearAnonymousSessionButton
          to={this.props.toCancel}
          portalRef={this.cancelControlRef}
          disableProgressiveEnhancement={
            this.props.disableProgressiveEnhancement
          }
          label="Cancel"
        />
        <Route
          path={routes.step1ConfirmAddressModal}
          exact
          render={() => <Step1ConfirmAddressModal toStep3={routes.step3} />}
        />
      </Page>
    );
  }
}

const OnboardingStep1 = withAppContext(
  withRouter(OnboardingStep1WithoutContexts)
);

export default OnboardingStep1;
