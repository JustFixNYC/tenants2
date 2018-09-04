import React from 'react';
import  _ from 'lodash';
import AriaModal from 'react-aria-modal';
import autobind from 'autobind-decorator';
import { RouteComponentProps, withRouter, Route } from 'react-router';
import { getAppStaticContext } from './app-static-context';
import { Link, LinkProps } from 'react-router-dom';


const DIALOG_CLASS = "jf-modal-dialog"

const UNDERLAY_CLASS = "jf-modal-underlay";

interface ModalRenderPropContext {
  /** Handler the render prop can call to close the modal. */
  close: () => void;
}

interface ModalProps {
  title: string;
  children?: any;
  render?: (ctx: ModalRenderPropContext) => JSX.Element;
  onClose?: () => void;
  onCloseGoBack?: boolean;
  onCloseGoTo?: string;
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
    if (this.props.onCloseGoTo) {
      this.props.history.push(this.props.onCloseGoTo);
    }
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  componentDidMount() {
    this.setState({ isActive: true });

    // It's possible that this modal was pre-rendered on the
    // server side. If so, get rid of it, since we've just
    // replaced it with this component instance.
    const prerenderedModalEl = document.getElementById('prerendered-modal');
    if (prerenderedModalEl && prerenderedModalEl.parentNode) {
      prerenderedModalEl.parentNode.removeChild(prerenderedModalEl);
    }
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
        {this.props.render && this.props.render({ close: this.handleClose })}
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

interface LinkToModalRouteProps extends LinkProps {
  to: string;
  component: React.ComponentType;
  children: any;
}

/**
 * A component that's similar to React Router's <Link> but
 * assumes the link target is a modal, and simultaneously
 * defines a route that points to said modal.
 */
export function ModalLink(props: LinkToModalRouteProps): JSX.Element {
  return (
    <React.Fragment>
      <Link {..._.omit(props, 'component')}>{props.children}</Link>
      <Route path={props.to} exact component={props.component} />
    </React.Fragment>
  );
}
