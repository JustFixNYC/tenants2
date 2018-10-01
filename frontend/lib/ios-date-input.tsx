import React, { DetailedHTMLProps, InputHTMLAttributes } from 'react';
import autobind from 'autobind-decorator';

type HTMLInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export class IosFriendlyDateInput extends React.Component<HTMLInputProps> {
  ref: React.RefObject<HTMLInputElement>;
  interval: number|null = null;
  intervalMs: number = 100;

  constructor(props: HTMLInputProps) {
    super(props);
    this.ref = React.createRef();
    this.interval = null;
  }

  @autobind
  handleInterval() {
    const input = this.ref.current;
    if (input) {
      input.defaultValue = '';
    }
  }

  componentDidMount() {
    // https://stackoverflow.com/a/9039885/2422398
    const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

    if (iOS) {
      this.interval = window.setInterval(this.handleInterval, this.intervalMs);
    }
  }

  componentWillUnmount() {
    if (this.interval !== null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
  }

  render() {
    return <input type="date" {...this.props} ref={this.ref} />;
  }
}
