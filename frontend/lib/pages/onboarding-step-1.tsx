import React from 'react';
import ReactDOM from 'react-dom';
import Page from '../page';
import { OnboardingRouteInfo } from '../routes';
import { Link, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { OnboardingStep1Mutation, BlankOnboardingStep1Input } from '../queries/OnboardingStep1Mutation';
import { assertNotNull, exactSubsetOrDefault } from '../util';
import { Modal, BackOrUpOneDirLevel } from '../modal';
import { TextualFormField, RadiosFormField, renderSimpleLabel, LabelRenderer, BaseFormFieldProps } from '../form-fields';
import { NextButton } from '../buttons';
import { withAppContext, AppContextType } from '../app-context';
import { LogoutMutation } from '../queries/LogoutMutation';
import { bulmaClasses } from '../bulma';
import { GeoAutocomplete } from '../geo-autocomplete';
import { getBoroughChoiceLabels, BoroughChoice, isBoroughChoice, BoroughChoices } from '../../../common-data/borough-choices';
import { ProgressiveEnhancement, ProgressiveEnhancementContext } from '../progressive-enhancement';
import { OutboundLink } from '../google-analytics';
import { toDjangoChoices } from '../common-data';
import { FormContext } from '../form-context';

function createAddressLabeler(toStep1AddressModal: string): LabelRenderer {
  return (label, labelProps) => (
    <div className="level is-marginless is-mobile">
      <div className="level-left">
        <div className="level-item is-marginless">
          {renderSimpleLabel(label, labelProps)}
        </div>
      </div>
      <div className="level-right">
        <div className="level-item is-marginless">
          <Link to={toStep1AddressModal} className="is-size-7">Why do you need my address?</Link>
        </div>
      </div>
    </div>
  );  
}

export function areAddressesTheSame(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

export function PrivacyInfoModal(): JSX.Element {
  return (
    <Modal title="Your privacy is very important to us!" onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => <>
      <div className="jf-is-scrollable-if-too-tall">
        <h5>Your privacy is very important to us! Here are some important things to know:</h5>
        <ul>
          <li>Your personal information is secure.</li>
          <li>We don’t use your personal information for profit or sell it to third parties.</li>
          <li>We use your address to find information about your landlord and your building.</li>
        </ul>
        <p>
          Our Privacy Policy enables sharing anonymized data with approved tenant advocacy {" "}
          organizations exclusively to help further our tenants rights mission. {" "}
          The Privacy Policy contains information regarding what data we collect, how we use it, {" "}
          and the choices you have regarding your personal information. If you’d like to read {" "}
          more, please review our full {" "}
          <OutboundLink href="https://www.justfix.nyc/privacy-policy" target="_blank">Privacy Policy</OutboundLink> and {" "}
          <OutboundLink href="https://www.justfix.nyc/terms-of-use" target="_blank">Terms of Use</OutboundLink>.
        </p>
      </div>
      <div className="has-text-centered"><Link className="button is-primary is-medium" {...ctx.getLinkCloseProps()}>Got it!</Link></div>
    </>} />
  );
}

export const ConfirmAddressModal = withAppContext((props: AppContextType & { toStep2: string }): JSX.Element => {
  const onboardingStep1 = props.session.onboardingStep1 || BlankOnboardingStep1Input;
  let borough = '';

  if (isBoroughChoice(onboardingStep1.borough)) {
    borough = getBoroughChoiceLabels()[onboardingStep1.borough];
  }

  return (
    <Modal title="Is this your address?" withHeading onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => <>
      <p>{onboardingStep1.address}, {borough}</p>
      <Link to={props.toStep2} className="button is-primary is-fullwidth">Yes!</Link>
      <Link {...ctx.getLinkCloseProps()} className="button is-text is-fullwidth">No, go back.</Link>
    </>} />
  );
});

type OnboardingStep1Props = {
  disableProgressiveEnhancement?: boolean;
  routes: OnboardingRouteInfo;
  toCancel: string;
} & RouteComponentProps<any> & AppContextType;

type AddressAndBoroughFieldProps = {
  disableProgressiveEnhancement?: boolean;
  onChange?: () => void;
  renderAddressLabel?: LabelRenderer,
  addressProps: BaseFormFieldProps<string>,
  boroughProps: BaseFormFieldProps<string>
};

export class AddressAndBoroughField extends React.Component<AddressAndBoroughFieldProps> {
  renderBaselineAddressFields(): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField
          label="Address"
          renderLabel={this.props.renderAddressLabel}
          {...this.props.addressProps}
        />
        <RadiosFormField
          label="What is your borough?"
          {...this.props.boroughProps}
          choices={toDjangoChoices(BoroughChoices, getBoroughChoiceLabels())}
        />
      </React.Fragment>
    );
  }

  renderEnhancedAddressField(pe: ProgressiveEnhancementContext) {
    const { addressProps, boroughProps } = this.props;
    let initialValue = addressProps.value && boroughProps.value
      ? { address: addressProps.value,
          borough: boroughProps.value as BoroughChoice }
      : undefined;

    if (boroughProps.errors && !addressProps.errors) {
      return this.renderBaselineAddressFields();
    }

    return <GeoAutocomplete
      label="Address"
      renderLabel={this.props.renderAddressLabel}
      initialValue={initialValue}
      onChange={selection => {
        this.props.onChange && this.props.onChange();
        addressProps.onChange(selection.address);
        boroughProps.onChange(selection.borough || '');
      }}
      onNetworkError={pe.fallbackToBaseline}
      errors={addressProps.errors}
    />;
  }

  render() {
    return (
      <ProgressiveEnhancement
        disabled={this.props.disableProgressiveEnhancement}
        renderBaseline={() => this.renderBaselineAddressFields()}
        renderEnhanced={(pe) => this.renderEnhancedAddressField(pe)} />
    );
  }
}

class OnboardingStep1WithoutContexts extends React.Component<OnboardingStep1Props> {
  readonly cancelControlRef: React.RefObject<HTMLDivElement> = React.createRef();
  private readonly renderAddressLabel = createAddressLabeler(this.props.routes.step1AddressModal);

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
            <TextualFormField label="First name" {...ctx.fieldPropsFor('firstName')} />
          </div>
          <div className="column">
            <TextualFormField label="Last name" {...ctx.fieldPropsFor('lastName')} />
          </div>
        </div>
        <AddressAndBoroughField
          disableProgressiveEnhancement={this.props.disableProgressiveEnhancement}
          renderAddressLabel={this.renderAddressLabel}
          addressProps={ctx.fieldPropsFor('address')}
          boroughProps={ctx.fieldPropsFor('borough')}
        />
        <TextualFormField label="Apartment number" autoComplete="address-line2 street-address" {...ctx.fieldPropsFor('aptNumber')} />
        <Route path={routes.step1AddressModal} exact component={PrivacyInfoModal} />
        <p>
          Your privacy is very important to us! Everything on JustFix.nyc is kept confidential and secure. {" "}
          <Link to={routes.step1AddressModal}>Click here to learn more<span className="jf-sr-only"> about our privacy policy</span></Link>.
        </p>
        <br/>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderHiddenLogoutForm(onSuccessRedirect: string) {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LogoutMutation}
        initialState={{}}
        onSuccessRedirect={onSuccessRedirect}
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
        <ProgressiveEnhancement
          disabled={this.props.disableProgressiveEnhancement}
          renderBaseline={() => <button type="submit" className="button is-light">Cancel signup</button>}
          renderEnhanced={() => {
            if (!this.cancelControlRef.current) throw new Error('cancelControlRef must exist!');
            return ReactDOM.createPortal(
              <button type="button" onClick={() => ctx.submit()} className={bulmaClasses('button', 'is-light', 'is-medium', {
                'is-loading': ctx.isLoading
              })}>Cancel signup</button>,
              this.cancelControlRef.current
            )
          }} />
      )}</SessionUpdatingFormSubmitter>
    );
  }

  render() {
    const { routes } = this.props;

    return (
      <Page title="Create an account to get started with JustFix.nyc!">
        <div>
          <h1 className="title is-4">Create an account to get started with JustFix.nyc!</h1>
          <SessionUpdatingFormSubmitter
            mutation={OnboardingStep1Mutation}
            initialState={s => exactSubsetOrDefault(s.onboardingStep1, BlankOnboardingStep1Input)}
            onSuccessRedirect={(output, input) => {
              const successSession = assertNotNull(output.session);
              const successInfo = assertNotNull(successSession.onboardingStep1);
              if (areAddressesTheSame(successInfo.address, input.address) &&
                  successInfo.borough === input.borough) {
                return routes.step2;
              }
              return routes.step1ConfirmAddressModal;
            }}
          >
            {this.renderForm}
          </SessionUpdatingFormSubmitter>
        </div>

        {this.renderHiddenLogoutForm(this.props.toCancel)}
        <Route path={routes.step1ConfirmAddressModal} exact render={() => (
          <ConfirmAddressModal toStep2={routes.step2} />
        )} />
      </Page>
    );
  }
}

const OnboardingStep1 = withAppContext(withRouter(OnboardingStep1WithoutContexts));

export default OnboardingStep1;
