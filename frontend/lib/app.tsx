import React from 'react';
import ReactDOM from 'react-dom';

import { setCsrfToken } from './fetch-graphql';
import { fetchSimpleQuery } from './queries/SimpleQuery';

type Color = 'black'|'info'|'danger';

export interface AppProps {
  staticURL: string;
  adminIndexURL: string;
  loadingMessage: string;
  csrfToken: string;
}

interface AppState {
  text: string;
  color: Color;
  graphQlResult?: string|null;
}

export async function getMessage(): Promise<string> {
  return new Promise<string>(resolve => {
    setTimeout(() => {
      resolve("HELLO FROM JAVASCRIPT-LAND");
    }, 3000);
  });
}

export class App extends React.Component<AppProps, AppState> {
  interval?: number;

  constructor(props: AppProps) {
    super(props);
    this.state = { text: props.loadingMessage, color: 'black' };
  }

  componentDidMount() {
    getMessage().then(text => {
      this.setState({ text, color: 'info' });
    }).catch(e => {
      this.setState({ text: e.message, color: 'danger' });
    });
    this.interval = window.setInterval(() => {
      this.setState(state => ({
        text: state.color === 'black' ? `${state.text}.` : state.text
      }));
    }, 1000);

    setCsrfToken(this.props.csrfToken);
    fetchSimpleQuery({ thing: (new Date()).toString() }).then(result => {
      this.setState({ graphQlResult: result.hello });
    });
  }

  componentWillUnmount() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  render() {
    return (
      <section className="hero is-fullheight">
        <div className="hero-head"></div>
        <div className="hero-body">
          <div className="container content box has-background-white">
            <h1 className="title">Ahoy, developer! </h1>
            <p>
                For more details on the size of our JS bundle, see the {` `}
                <a href={`${this.props.staticURL}frontend/report.html`}>webpack bundle analysis report</a>.
            </p>
            <p>
                Or you can visit the <a href={this.props.adminIndexURL}>admin</a>, though
                you will probably want to run <code>manage.py createsuperuser</code> first.
            </p>
            {this.state.graphQlResult ? <p>GraphQL says <strong>{this.state.graphQlResult}</strong>.</p> : null}
            <p className={`has-text-${this.state.color} is-pulled-right`}>
              { this.state.text }
            </p>
          </div>
        </div>
        <div className="hero-foot"></div>
      </section>
    );
  }
}

export function startApp(container: Element, initialProps: AppProps) {
  const el = <App {...initialProps}/>;
  if (container.children.length) {
    // Initial content has been generated server-side, so bind to it.
    ReactDOM.hydrate(el, container);
  } else {
    // No initial content was provided, so generate a DOM from scratch.
    ReactDOM.render(el, container);
  }
}
