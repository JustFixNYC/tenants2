import React from 'react';
import Page from '../page';
import { bulmaClasses } from '../bulma';
import Routes from '../routes';
import { Link } from 'react-router-dom';
import { BaseFormProps, Form, TextualFormField, FormErrors, getFormErrors } from '../forms';
import { OnboardingStep1Input } from '../queries/globalTypes';
import autobind from 'autobind-decorator';
import { fetchOnboardingStep1Mutation } from '../queries/OnboardingStep1Mutation';


const initialState: OnboardingStep1Input = {
  name: '',
  address: '',
  aptNumber: ''
};

interface FormState {
  isLoading: boolean;
  errors?: FormErrors<OnboardingStep1Input>;
}

interface OnboardingStep1Props {
  fetch: (query: string, variables?: any) => Promise<any>;
}

export default class OnboardingStep1 extends React.Component<OnboardingStep1Props, FormState> {
  constructor(props: OnboardingStep1Props) {
    super(props);
    this.state = { isLoading: false };
  }

  @autobind
  handleSubmit(input: OnboardingStep1Input) {
    this.setState({ isLoading: true, errors: undefined });
    return fetchOnboardingStep1Mutation(this.props.fetch, { input }).then(result => {
      const { errors } = result.onboardingStep1;
      if (errors) {
        this.setState({
          isLoading: false,
          errors: getFormErrors<OnboardingStep1Input>(errors)
        });
      } else {
        // TODO: Set name/address/apt # in state or something.
        this.setState({ isLoading: false });
      }
    }).catch(e => {
      this.setState({ isLoading: false });
    });
  }

  render() {
    const { state } = this;

    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <p>JustFix.nyc is a nonprofit based in NYC. We're here to help you learn your rights and take action to get repairs in your apartment!</p>
        <br/>
        <Form isLoading={state.isLoading} onSubmit={this.handleSubmit} errors={state.errors} initialState={initialState}>
          {(ctx) => (
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
            </React.Fragment>
          )}
        </Form>
      </Page>
    );
  }
}
