import React from 'react';
import AriaModal from 'react-aria-modal';
import autobind from 'autobind-decorator';


interface ModalProps {
  children: any;
}

interface ModalState {
  isActive: boolean;
}

export class Modal extends React.Component<ModalProps, ModalState> {
  constructor(props: ModalProps) {
    super(props);
    this.state = {
      isActive: false
    };
  }

  @autobind
  handleClose() {
    this.setState({ isActive: false });
  }

  componentDidMount() {
    this.setState({ isActive: true });
  }

  render() {
    if (!this.state.isActive) {
      return null;
    }

    return (
      <AriaModal
        titleText="BOOP"
        onExit={this.handleClose}
        includeDefaultStyles={false}
        dialogClass="jf-modal-dialog"
        underlayClass="jf-modal-underlay"
      >
        {this.props.children}
        <button onClick={this.handleClose} className="modal-close is-large" aria-label="close"></button>
      </AriaModal>
    );
  }
}
