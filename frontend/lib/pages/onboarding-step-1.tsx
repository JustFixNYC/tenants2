import React from 'react';
import ReactDOM from 'react-dom';
import Downshift, { ControllerStateAndHelpers, DownshiftInterface } from 'downshift';
import classnames from 'classnames';
import Page from '../page';
import Routes from '../routes';
import { Link, Route } from 'react-router-dom';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { OnboardingStep1Mutation } from '../queries/OnboardingStep1Mutation';
import { assertNotNull } from '../util';
import { Modal, ModalLink } from '../modal';
import { DjangoChoices, getDjangoChoiceLabel } from '../common-data';
import { TextualFormField, SelectFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { withAppContext, AppContextType } from '../app-context';
import { LogoutMutation } from '../queries/LogoutMutation';
import { bulmaClasses } from '../bulma';

const BOROUGH_CHOICES = require('../../../common-data/borough-choices.json') as DjangoChoices;

/**
 * The keys here were obtained experimentally, I'm not actually sure
 * if/where they are formally specified.
 */
const BOROUGH_GID_TO_CHOICE: { [key: string]: string|undefined } = {
  'whosonfirst:borough:1': 'MANHATTAN',
  'whosonfirst:borough:2': 'BRONX',
  'whosonfirst:borough:3': 'BROOKLYN',
  'whosonfirst:borough:4': 'QUEENS',
  'whosonfirst:borough:5': 'STATEN_ISLAND',
};

const blankInitialState: OnboardingStep1Input = {
  name: '',
  address: '',
  aptNumber: '',
  borough: '',
};

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

export const ConfirmAddressModal = withAppContext((props: AppContextType): JSX.Element => {
  const onboardingStep1 = props.session.onboardingStep1 || blankInitialState;
  const borough = onboardingStep1.borough
    ? getDjangoChoiceLabel(BOROUGH_CHOICES, onboardingStep1.borough)
    : '';

  return (
    <Modal title="Is this your address?" onCloseGoBack render={({close}) => (
      <div className="content box">
        <h1 className="title">Is this your address?</h1>
        <p>{onboardingStep1.address}, {borough}</p>
        <button className="button is-text is-fullwidth" onClick={close}>No, go back.</button>
        <Link to={Routes.onboarding.step2} className="button is-primary is-fullwidth">Yes!</Link>
      </div>
    )} />
  );
});

interface OnboardingStep1State {
  isMounted: boolean;
}

type GeoAutocompleteItem = GeoSearchProperties;

interface GeoAutocompleteProps {
  label: string;
  initialValue: string;
  onChange: (item: GeoAutocompleteItem) => void;
};

interface GeoSearchProperties {
  /** e.g. "Brooklyn" */
  borough: string;

  /** e.g. "whosonfirst:borough:2" */
  borough_gid: string;

  /** e.g. "150" */
  housenumber: string;

  /** e.g. "150 COURT STREET" */
  name: string;

  /** e.g. "150 COURT STREET, Brooklyn, New York, NY, USA" */
  label: string;
}

interface GeoSearchResults {
  bbox: unknown;
  features: {
    geometry: unknown;
    properties: GeoSearchProperties
  }[];
}

interface GeoAutocompleteState {
  results: GeoAutocompleteItem[];
}

/**
 * The amount of ms we'll wait after the user pressed a key
 * before we'll issue a network request to fetch autocompletion
 * results.
 */
const AUTOCOMPLETE_KEY_THROTTLE_MS = 250;

/**
 * For documentation about this endpoint, see:
 * 
 * https://geosearch.planninglabs.nyc/docs/#autocomplete
 */
const GEO_AUTOCOMPLETE_URL = 'https://geosearch.planninglabs.nyc/v1/autocomplete';

/** The maximum number of autocomplete suggestions to show. */
const MAX_SUGGESTIONS = 5;

export class GeoAutocomplete extends React.Component<GeoAutocompleteProps, GeoAutocompleteState> {
  keyThrottleTimeout: number|null;
  abortController: AbortController;

  constructor(props: GeoAutocompleteProps) {
    super(props);
    this.state = {
      results: []
    };
    this.keyThrottleTimeout = null;
    this.abortController = new AbortController();
  }

  renderAutocomplete(ds: ControllerStateAndHelpers<GeoAutocompleteItem>): JSX.Element {
    return (
      <div className="field jf-autocomplete-field">
        <label className="label" {...ds.getLabelProps()}>{this.props.label}</label>
        <div className="control">
          <input className="input" {...ds.getInputProps()} />
          <ul className={classnames({
            'jf-autocomplete-open': ds.isOpen && this.state.results.length > 0
          })} {...ds.getMenuProps()}>
            {ds.isOpen &&
              this.state.results
                .map((item, index) => {
                  const props = ds.getItemProps({
                    key: item.label,
                    index,
                    item,
                    className: classnames({
                      'jf-autocomplete-is-highlighted': ds.highlightedIndex === index,
                      'jf-autocomplete-is-selected': ds.selectedItem === item
                    })
                  });

                  return (
                    <li {...props}>
                      {item.name}, {item.borough}
                    </li>
                  );
                })
            }
          </ul>
        </div>
      </div>
    );
  }

  resetSearchRequest() {
    if (this.keyThrottleTimeout !== null) {
      window.clearTimeout(this.keyThrottleTimeout);
      this.keyThrottleTimeout = null;
    }
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  @autobind
  handleFetchError(e: Error) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      // Don't worry about it, the user just aborted the request.
    } else {
      console.error('Alas, an error occurred: ', e);
    }
  }

  @autobind
  handleSearchResults(results: GeoSearchResults) {
    this.setState({
      results: results.features.map(feature => feature.properties).slice(0, MAX_SUGGESTIONS)
    });
  }

  @autobind
  handleInputValueChange(value: string) {
    this.resetSearchRequest();
    if (value.length > 3 && value.indexOf(' ') > 0) {
      this.keyThrottleTimeout = window.setTimeout(() => {
        fetch(`${GEO_AUTOCOMPLETE_URL}?text=${encodeURIComponent(value)}`, {
          signal: this.abortController.signal
        }).then(response => response.json())
          .then(this.handleSearchResults)
          .catch(this.handleFetchError);
      }, AUTOCOMPLETE_KEY_THROTTLE_MS);
    } else {
      this.setState({ results: [] });
    }
  }

  componentWillUnmount() {
    this.resetSearchRequest();
  }

  render() {
    const GeoAutocomplete = Downshift as DownshiftInterface<GeoAutocompleteItem>;
    return (
      <GeoAutocomplete
        onChange={this.props.onChange}
        onInputValueChange={this.handleInputValueChange}
        defaultInputValue={this.props.initialValue}
        itemToString={item => item ? `${item.name}, ${item.borough}` : ''}
      >
        {(downshift) => this.renderAutocomplete(downshift)}
      </GeoAutocomplete>
    );
  }
}

interface ProgressiveEnhancementProps {
  children: (isEnhanced: boolean) => JSX.Element;
}

interface ProgressiveEnhancementState {
  isEnhanced: boolean;
}

export class ProgressiveEnhancement extends React.Component<ProgressiveEnhancementProps, ProgressiveEnhancementState> {
  constructor(props: ProgressiveEnhancementProps) {
    super(props);
    this.state = { isEnhanced: false };
  }

  componentDidMount() {
    this.setState({ isEnhanced: true });
  }

  render() {
    return this.props.children(this.state.isEnhanced);
  }
}

interface OnboardingStep1Props {
  disableProgressiveEnhancement?: boolean;
}

export default class OnboardingStep1 extends React.Component<OnboardingStep1Props, OnboardingStep1State> {
  readonly cancelControlRef: React.RefObject<HTMLDivElement> = React.createRef();
  readonly state = { isMounted: false };

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control" ref={this.cancelControlRef} />
        <div className="control">
          <NextButton isLoading={isLoading} />
        </div>
      </div>
    );
  }

  @autobind
  renderForm(ctx: FormContext<OnboardingStep1Input>): JSX.Element {
    return (
      <React.Fragment>
        <TextualFormField label="What is your full name?" {...ctx.fieldPropsFor('name')} />
        <ProgressiveEnhancement>
          {(isEnhanced) => {
            if (isEnhanced && !this.props.disableProgressiveEnhancement) {
              const addressProps = ctx.fieldPropsFor('address');
              const boroughProps = ctx.fieldPropsFor('borough');
              let initialValue = '';

              if (addressProps.value && boroughProps.value) {
                const borough = getDjangoChoiceLabel(BOROUGH_CHOICES, boroughProps.value);
                initialValue = `${addressProps.value}, ${borough}`;
              }

              return <GeoAutocomplete
                label="What is your address?"
                initialValue={initialValue}
                onChange={selection => {
                  addressProps.onChange(selection.name);
                  boroughProps.onChange(BOROUGH_GID_TO_CHOICE[selection.borough_gid] || '');
                }}
              />;
            } else {
              return (
                <React.Fragment>
                  <TextualFormField label="What is your address?" {...ctx.fieldPropsFor('address')} />
                  <SelectFormField
                    label="What is your borough?"
                    {...ctx.fieldPropsFor('borough')}
                    choices={BOROUGH_CHOICES}
                  />
                </React.Fragment>
              );
            }
          }}
        </ProgressiveEnhancement>
        <TextualFormField label="What is your apartment number?" {...ctx.fieldPropsFor('aptNumber')} />
        <ModalLink to={Routes.onboarding.step1AddressModal} component={Step1AddressModal} className="is-size-7">
          Why do you need my address?
        </ModalLink>
        <br/>
        <br/>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderHiddenLogoutForm() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LogoutMutation}
        initialState={{}}
        onSuccessRedirect={Routes.home}
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
        <React.Fragment>
          {this.state.isMounted && this.cancelControlRef.current
            ? ReactDOM.createPortal(
                <button type="button" onClick={ctx.submit} className={bulmaClasses('button', 'is-light', {
                  'is-loading': ctx.isLoading
                })}>Cancel signup</button>,
                this.cancelControlRef.current
              )
            : <button type="submit" className="button is-light">Cancel signup</button>}
        </React.Fragment>
      )}</SessionUpdatingFormSubmitter>
    );
  }

  render() {
    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <p>JustFix.nyc is a nonprofit based in NYC. We're here to help you learn your rights and take action to get repairs in your apartment!</p>
        <br/>
        <SessionUpdatingFormSubmitter
          mutation={OnboardingStep1Mutation}
          initialState={(session) => session.onboardingStep1 || blankInitialState}
          onSuccessRedirect={(output, input) => {
            const successSession = assertNotNull(output.session);
            const successInfo = assertNotNull(successSession.onboardingStep1);
            if (areAddressesTheSame(successInfo.address, input.address)) {
              return Routes.onboarding.step2;
            }
            return Routes.onboarding.step1ConfirmAddressModal;
          }}
        >
          {this.renderForm}
        </SessionUpdatingFormSubmitter>
        {this.renderHiddenLogoutForm()}
        <Route path={Routes.onboarding.step1ConfirmAddressModal} exact component={ConfirmAddressModal} />
      </Page>
    );
  }
}
