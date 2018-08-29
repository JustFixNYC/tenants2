import React from 'react';
import AriaModal from 'react-aria-modal';
import autobind from 'autobind-decorator';
import { RouteComponentProps, withRouter } from 'react-router';
import { getAppStaticContext } from './app-static-context';


const DIALOG_CLASS = "jf-modal-dialog"

const UNDERLAY_CLASS = "jf-modal-underlay";

interface ModalProps {
  title: string;
  children: any;
  onCloseGoBack?: boolean;
}

type ModalPropsWithRouter = ModalProps & RouteComponentProps<any>;

interface ModalState {
  isActive: boolean;
}

export class ModalWithoutRouter extends React.Component<ModalPropsWithRouter, ModalState> {
  constructor(props: ModalPropsWithRouter) {
    super(props);
    this.state = {
      isActive: false
    };
  }

  @autobind
  handleClose() {
    this.setState({ isActive: false });
    if (this.props.onCloseGoBack) {
      this.props.history.goBack();
    }
  }

  componentDidMount() {
    this.setState({ isActive: true });
  }

  renderServerModal(): JSX.Element {
    return (
      <div className={UNDERLAY_CLASS}>
        <div className={DIALOG_CLASS}>
          {this.renderBody()}
        </div>
      </div>
    );
  }

  renderBody(): JSX.Element {
    return (
      <React.Fragment>
        {this.props.children}
        <button onClick={this.handleClose} className="modal-close is-large" aria-label="close"></button>
      </React.Fragment>
    );
  }

  render() {
    const ctx = getAppStaticContext(this.props);
    if (ctx) {
      ctx.modal = this.renderServerModal();
    }

    if (!this.state.isActive) {
      return null;
    }

    return (
      <AriaModal
        titleText={this.props.title}
        onExit={this.handleClose}
        includeDefaultStyles={false}
        dialogClass={DIALOG_CLASS}
        underlayClass={UNDERLAY_CLASS}
        focusDialog
      >
        {this.renderBody()}
      </AriaModal>
    );
  }
}

export const Modal = withRouter(ModalWithoutRouter);
