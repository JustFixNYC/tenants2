import React from 'react';

import { LoadingPage } from '../loading-page';
import Page from '../page';

interface State {
  error: boolean;
  mount: boolean;
}

const page = (
  <Page title="Example loading page">
    <p>This page can be used to test the loading screen via the panel at the bottom-right.</p>
  </Page>
);

export default class ExampleLoadingPage extends React.Component<{}, State> {
  state: State = { error: false, mount: false };

  renderCheckbox<K extends keyof State>(k: K, disabled?: boolean): JSX.Element {
    return (
      <label>
        <input
          type="checkbox"
          checked={this.state[k]}
          disabled={disabled}
          onChange={(e) => {
            const { checked } = e.target;
            this.setState(state => ({
              ...state,
              [k]: checked
            }));
          }}
        />
        {k}
      </label>
    );
  }

  render() {
    return (
      <>
        {this.state.mount ? <LoadingPage
          isLoading={true}
          pastDelay={false}
          timedOut={false}
          error={this.state.error}
          retry={() => {
            this.setState({ mount: true, error: false });
          }}
        /> : page}
        <div className="jf-loading-page-devtools">
          {this.renderCheckbox('mount')}
          {this.renderCheckbox('error', !this.state.mount)}
        </div>
      </>
    );
  }
}
