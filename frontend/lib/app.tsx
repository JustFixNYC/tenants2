import React from 'react';
import ReactDOM from 'react-dom';

type Color = 'blue'|'red';

interface AppProps {
}

interface AppState {
  text: string;
  color: Color;
}

export async function getMessage(): Promise<string> {
  const boop = <p>blarg</p>;
  return "HELLO FROM JAVASCRIPT-LAND";
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = { text: '', color: 'blue' };
  }

  componentDidMount() {
    getMessage().then(text => {
      this.setState({ text, color: 'blue' });
    }).catch(e => {
      this.setState({ text: e.message, color: 'red' });
    });
  }

  render() {
    return <p style={{ color: this.state.color }}>{ this.state.text }</p>;
  }
}

export function startApp(container: Element) {
  ReactDOM.render(<App/>, container);
}
