import React from 'react';

interface ProgressiveEnhancementProps {
  renderEnhanced: () => JSX.Element;
  renderBaseline: () => JSX.Element;
  disabled?: boolean;
}

interface ProgressiveEnhancementState {
  isMounted: boolean;
  caughtError: boolean;
}

export class ProgressiveEnhancement extends React.Component<ProgressiveEnhancementProps, ProgressiveEnhancementState> {
  constructor(props: ProgressiveEnhancementProps) {
    super(props);
    this.state = {
      isMounted: false,
      caughtError: false
    };
  }

  componentDidCatch(error: Error) {
    if (this.isEnhanced()) {
      this.setState({ caughtError: true });
    } else {
      throw error;
    }
  }

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  isEnhanced() {
    return this.state.isMounted && !this.props.disabled && !this.state.caughtError;
  }

  render() {
    if (this.isEnhanced()) {
      return this.props.renderEnhanced();
    } else {
      return this.props.renderBaseline();
    }
  }
}
