import React from 'react';
import Page from '../page';
import { bulmaClasses } from '../bulma';
import Routes from '../routes';
import { Link } from 'react-router-dom';
import autobind from 'autobind-decorator';


export default class OnboardingPage1 extends React.Component {
  @autobind
  handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.alert("TODO IMPLEMENT THIS");
  }

  render() {
    return (
      <Page title="Tell us about yourself!">
        <h1 className="title">Tell us about yourself!</h1>
        <p>JustFix.nyc is a nonprofit based in NYC. We're here to help you learn your rights and take action to get repairs in your apartment!</p>
        <br/>
        <form onSubmit={this.handleSubmit}>
          <div className="field is-grouped">
            <div className="control">
              <Link to={Routes.home} className="button is-text">Cancel</Link>
            </div>
            <div className="control">
              <button type="submit" className={bulmaClasses('button', 'is-primary', {
                'is-loading': false
              })}>Next</button>
            </div>
          </div>
        </form>
      </Page>
    );
  }
}
