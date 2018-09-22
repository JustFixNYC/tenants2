import React from 'react';

interface ProgressiveEnhancementProps {
  children: (isEnhanced: boolean) => JSX.Element;
}

interface ProgressiveEnhancementState {
  isEnhanced: boolean;
}

export class ProgressiveEnhancement extends React.Component<ProgressiveEnhancementProps, ProgressiveEnhancementState> {
  constructor(props: ProgressiveEnhancementProps) {
    super(props);
    this.state = { isEnhanced: false };
  }

  componentDidMount() {
    this.setState({ isEnhanced: true });
  }

  render() {
    return this.props.children(this.state.isEnhanced);
  }
}
