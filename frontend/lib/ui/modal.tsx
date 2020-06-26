import React from "react";
import AriaModal from "@justfixnyc/react-aria-modal";
import autobind from "autobind-decorator";
import {
  RouteComponentProps,
  withRouter,
  Route,
  RouteProps,
} from "react-router";
import { Location } from "history";
import { getAppStaticContext } from "../app-static-context";
import { Link, LinkProps } from "react-router-dom";
import {
  TransitionContextType,
  withTransitionContext,
} from "./transition-context";

const ANIMATION_CLASS = "jf-fadein-half-second";

const DIALOG_CLASS = "jf-modal-dialog";

const UNDERLAY_CLASS = "jf-modal-underlay";

type BackOrUpOneDirLevel = 1;

export const BackOrUpOneDirLevel = 1;

interface ModalRenderPropContext {
  /**
   * Returns Link properties for closing the modal, to be used by
   * e.g. custom-rendered "ok" buttons.
   */
  getLinkCloseProps: () => LinkProps;
}

interface ModalProps {
  title: string;
  children?: any;
  render?: (ctx: ModalRenderPropContext) => JSX.Element;
  onCloseGoTo: string | BackOrUpOneDirLevel | ((location: Location) => string);
  withHeading?: boolean;
}

type ModalPropsWithRouter = ModalProps &
  RouteComponentProps<any> &
  TransitionContextType;

interface ModalState {
  isActive: boolean;
  animate: boolean;
}

export function getOneDirLevelUp(path: string) {
  return path.split("/").slice(0, -1).join("/");
}

export class ModalWithoutRouter extends React.Component<
  ModalPropsWithRouter,
  ModalState
> {
  raf: number | null = null;

  constructor(props: ModalPropsWithRouter) {
    super(props);
    this.state = {
      isActive: false,
      animate: true,
    };
  }

  get closeDestination(): string {
    const goTo = this.props.onCloseGoTo;
    if (typeof goTo === "string") {
      return goTo;
    } else if (typeof goTo === "function") {
      return goTo(this.props.location);
    }
    switch (goTo) {
      case BackOrUpOneDirLevel:
        return getOneDirLevelUp(this.props.location.pathname);
    }
  }

  @autobind
  getLinkCloseProps(): LinkProps {
    return {
      to: this.closeDestination,
      onClick: (e) => {
        e.preventDefault();
        this.handleClose();
      },
    };
  }

  @autobind
  handleClose() {
    // Note that we don't need to set isActive to false here;
    // because this modal class is route-based, we'll simply trust
    // that the modal doesn't exist in the route the user is sent to.
    if (
      this.props.onCloseGoTo === BackOrUpOneDirLevel &&
      this.props.history.action === "PUSH"
    ) {
      this.props.history.goBack();
    } else if (this.closeDestination) {
      this.props.history.push(this.closeDestination);
    }
  }

  componentDidMount() {
    this.setState({ isActive: true });

    // It's possible that this modal was pre-rendered on the
    // server side. If so, get rid of it, since we've just
    // replaced it with this component instance.
    const prerenderedModalEl = document.getElementById("prerendered-modal");
    if (prerenderedModalEl && prerenderedModalEl.parentNode) {
      if (prerenderedModalEl.children.length) {
        // There's an actual modal we're replacing; since it came with the
        // page, it's already being shown at its final location, so we don't
        // want to animate ourselves in, lest we disorient the user.
        this.setState({ animate: false });
      }
      prerenderedModalEl.parentNode.removeChild(prerenderedModalEl);
    }
  }

  componentDidUpdate(prevProps: ModalPropsWithRouter) {
    if (this.props.transition === "exit" && prevProps.transition !== "exit") {
      // For some reason we need to delay for one frame after the
      // exit transition starts, or else the browser will get confused
      // and not transition everything properly.
      this.raf = window.requestAnimationFrame(() => {
        this.raf = null;
        this.setState({ isActive: false });
      });
    }
  }

  componentWillUnmount() {
    if (this.raf !== null) {
      window.cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  renderServerModal(): JSX.Element {
    return (
      <div className={UNDERLAY_CLASS}>
        <div className={DIALOG_CLASS}>{this.renderBody()}</div>
      </div>
    );
  }

  renderBody(): JSX.Element {
    return (
      <>
        <div className="modal-content">
          <div className="content box scrollable">
            {this.props.withHeading && (
              <h1 className="title is-4">{this.props.title}</h1>
            )}
            {this.props.render &&
              this.props.render({
                getLinkCloseProps: this.getLinkCloseProps,
              })}
            {this.props.children}
          </div>
        </div>
        <Link
          {...this.getLinkCloseProps()}
          className="modal-close is-large"
          aria-label="close"
        ></Link>
      </>
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

    const underlayClasses = [UNDERLAY_CLASS];

    if (this.state.animate) {
      underlayClasses.push(ANIMATION_CLASS);
    }

    return (
      <AriaModal
        titleText={this.props.title}
        onExit={this.handleClose}
        includeDefaultStyles={false}
        dialogClass={DIALOG_CLASS}
        underlayClass={underlayClasses.join(" ")}
        focusDialog
      >
        {this.renderBody()}
      </AriaModal>
    );
  }
}

export const Modal = withRouter(withTransitionContext(ModalWithoutRouter));

interface BaseLinkToModalRouteProps extends LinkProps {
  to: string;
  children: any;
}

type ComponentLinkToModalRouteProps = BaseLinkToModalRouteProps & {
  component: React.ComponentType;
};

type RenderLinkToModalRouteProps = BaseLinkToModalRouteProps & {
  render: () => JSX.Element;
};

type LinkToModalRouteProps =
  | ComponentLinkToModalRouteProps
  | RenderLinkToModalRouteProps;

/**
 * A component that's similar to React Router's <Link> but
 * assumes the link target is a modal, and simultaneously
 * defines a route that points to said modal.
 */
export function ModalLink(props: LinkToModalRouteProps): JSX.Element {
  const make = (linkProps: LinkProps, routeProps: RouteProps) => (
    <>
      <Link {...linkProps}>{props.children}</Link>
      <Route path={props.to} exact {...routeProps} />
    </>
  );

  if ("component" in props) {
    const { component, ...linkProps } = props;
    return make(linkProps, { component });
  } else {
    const { render, ...linkProps } = props;
    return make(linkProps, { render });
  }
}
