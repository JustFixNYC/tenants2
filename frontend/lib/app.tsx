import React from 'react';
import ReactDOM from 'react-dom';

type Color = 'black'|'info'|'danger';

export interface AppProps {
  loadingMessage: string;
}

interface AppState {
  text: string;
  color: Color;
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
  }

  componentWillUnmount() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  render() {
    return (
      <p className={`has-text-${this.state.color}`}>
        { this.state.text }
      </p>
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
