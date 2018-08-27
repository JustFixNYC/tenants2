import React from 'react';
import Page from '../page';
import { bulmaClasses } from '../bulma';
import Routes from '../routes';
import { Link } from 'react-router-dom';
import { BaseFormProps, Form, TextualFormField } from '../forms';


interface OnboardingPage1Input {
  name: string;
  address: string;
  aptNumber: string;
}

const initialState: OnboardingPage1Input = {
  name: '',
  address: '',
  aptNumber: ''
};

type OnboardingPage1FormProps = BaseFormProps<OnboardingPage1Input>;

const fakeProps: OnboardingPage1FormProps = {
  onSubmit(input) {
    window.alert("TODO IMPLEMENT THIS");
  },
  isLoading: false,
};

export default class OnboardingPage1 extends React.Component {
  render() {
    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <p>JustFix.nyc is a nonprofit based in NYC. We're here to help you learn your rights and take action to get repairs in your apartment!</p>
        <br/>
        <Form {...fakeProps} initialState={initialState}>
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
