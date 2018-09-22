import React from 'react';

interface ProgressiveEnhancementProps {
  renderEnhanced: () => JSX.Element;
  renderBaseline: () => JSX.Element;
  disabled?: boolean;
}

interface ProgressiveEnhancementState {
  isMounted: boolean;
}

export class ProgressiveEnhancement extends React.Component<ProgressiveEnhancementProps, ProgressiveEnhancementState> {
  constructor(props: ProgressiveEnhancementProps) {
    super(props);
    this.state = { isMounted: false };
  }

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  render() {
    if (this.state.isMounted && !this.props.disabled) {
      return this.props.renderEnhanced();
    } else {
      return this.props.renderBaseline();
    }
  }
}
