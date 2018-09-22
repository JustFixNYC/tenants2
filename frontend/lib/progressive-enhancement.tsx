import React from 'react';
import autobind from 'autobind-decorator';

interface ProgressiveEnhancementProps {
  renderEnhanced: (ctx: ProgressiveEnhancementContext) => JSX.Element;
  renderBaseline: () => JSX.Element;
  disabled?: boolean;
}

interface ProgressiveEnhancementState {
  isMounted: boolean;
  hasCaughtError: boolean;
  hasFallenback: boolean;
}

interface ProgressiveEnhancementContext {
  fallbackToBaseline: () => void;
}

export class ProgressiveEnhancement extends React.Component<ProgressiveEnhancementProps, ProgressiveEnhancementState> {
  constructor(props: ProgressiveEnhancementProps) {
    super(props);
    this.state = {
      isMounted: false,
      hasCaughtError: false,
      hasFallenback: false
    };
  }

  componentDidCatch(error: Error) {
    if (this.isEnhanced()) {
      this.setState({ hasCaughtError: true });
    } else {
      throw error;
    }
  }

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  @autobind
  fallbackToBaseline() {
    this.setState({ hasFallenback: true });
  }

  isEnhanced() {
    return (
      this.state.isMounted &&
      !this.props.disabled &&
      !this.state.hasCaughtError &&
      !this.state.hasFallenback
    );
  }

  render() {
    if (this.isEnhanced()) {
      return this.props.renderEnhanced({
        fallbackToBaseline: this.fallbackToBaseline
      });
    } else {
      return this.props.renderBaseline();
    }
  }
}
