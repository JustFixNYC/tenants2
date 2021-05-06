import React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import autobind from "autobind-decorator";
import { UnregisterCallback, Location, Action } from "history";
import { assertNotNull } from "@justfixnyc/util";
import { isModalRoute } from "../util/route-util";
import { ga } from "../analytics/google-analytics";

const DEFAULT_PROMPT =
  "Are you sure you want to leave this page? " +
  "Changes you made may not be saved.";

/**
 * Our custom function for confirming whether the user wants
 * to navigate away from the page. For more details, see:
 *
 * https://github.com/ReactTraining/history#customizing-the-confirm-dialog
 */
export function getNavigationConfirmation(
  message: string,
  callback: (result: boolean) => void
) {
  // This is almost identical to the default implementation; we just
  // want to record the user's response for analytics purposes.
  const allowTransition = window.confirm(message);
  ga(
    "send",
    "event",
    "before-navigate",
    "confirm",
    allowTransition ? "ok" : "cancel"
  );
  callback(allowTransition);
}

/**
 * A history blocker callback should return true if navigation
 * should be "blocked" by a confirmation dialog (e.g. if the user
 * has a partially filled-out form they haven't submitted yet),
 * false otherwise.
 */
type HistoryBlockerCb = () => boolean;

type HistoryBlockerContextType = {
  /** Register a history blocker callback. */
  block(blockCb: HistoryBlockerCb): void;

  /**
   * Unregister a history blocker callback. If the callback
   * wasn't previously registered, an exception will be thrown.
   */
  unblock(blockCb: HistoryBlockerCb): void;
};

export const HistoryBlockerContext = React.createContext<
  HistoryBlockerContextType
>({
  block: () => {},
  unblock: () => {},
});

type ManagerProps = RouteComponentProps<any>;

/**
 * The history blocker manager keeps track of blocker callbacks
 * and calls them when the user attempts to navigate away from
 * the page (either to another page, or outside our single-page
 * application entirely). If any one of them tells us to
 * display a confirmation dialog, we do so.
 */
export class HistoryBlockerManagerWithoutRouter extends React.Component<
  ManagerProps
> {
  callbacks: HistoryBlockerCb[];
  unblockHistory: UnregisterCallback | null;

  constructor(props: ManagerProps) {
    super(props);
    this.callbacks = [];
    this.unblockHistory = null;
  }

  @autobind
  block(blockCb: HistoryBlockerCb) {
    this.callbacks.push(blockCb);
  }

  @autobind
  unblock(blockCb: HistoryBlockerCb) {
    const index = this.callbacks.indexOf(blockCb);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    } else {
      throw new Error(
        "callback passed to unblock() was not previously registered via block()"
      );
    }
  }

  shouldBlock(): boolean {
    return this.callbacks.some((cb) => cb());
  }

  @autobind
  handleBeforeUnload(e: BeforeUnloadEvent): undefined | string {
    if (this.shouldBlock()) {
      // Cancel the event as defined by the HTML5 standard.
      e.preventDefault();
      // Apparently Chrome needs this.
      e.returnValue = "";
      ga("send", "event", "before-unload", "prevent-default");
      return "";
    }
    return undefined;
  }

  @autobind
  handleBlock(location: Location, action: Action): string | undefined {
    const fromLocation = this.props.location;
    if (isModalRoute(fromLocation.pathname, location.pathname)) {
      return undefined;
    }
    return this.shouldBlock() ? DEFAULT_PROMPT : undefined;
  }

  componentDidMount() {
    this.unblockHistory = this.props.history.block(this.handleBlock);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  componentWillUnmount() {
    assertNotNull(this.unblockHistory)();
    this.unblockHistory = null;
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  }

  render() {
    return (
      <HistoryBlockerContext.Provider
        value={{
          block: this.block,
          unblock: this.unblock,
        }}
        children={this.props.children}
      />
    );
  }
}

export const HistoryBlockerManager = withRouter(
  HistoryBlockerManagerWithoutRouter
);

interface HistoryBlockerProps {
  /**
   * Don't actually raise a confirmation dialog if the user
   * navigates away from the current page, but *do* log an
   * analytics event that lets us know that a user navigated
   * away from the page (presumably without submitting their
   * data or some other criteria).
   */
  reportOnly?: boolean;
  children?: never;
}

/**
 * When this component is present in the component heirarchy,
 * a confirmation modal will be displayed when the user
 * tries to navigate away from the current page.
 *
 * Clients can use this logic to conditionally render
 * the component based on some criteria; e.g., a form
 * can only render it if the user has started filling it
 * out but hasn't submitted it yet.
 *
 * This component doesn't render anything.
 */
export function HistoryBlocker(props: HistoryBlockerProps): JSX.Element {
  return (
    <HistoryBlockerContext.Consumer
      children={(ctx) => <HistoryBlockerWithoutContext {...ctx} {...props} />}
    />
  );
}

class HistoryBlockerWithoutContext extends React.Component<
  HistoryBlockerProps & HistoryBlockerContextType
> {
  @autobind
  handleBlock(): boolean {
    if (this.props.reportOnly) {
      ga("send", "event", "before-navigate", "no-confirm");
      return false;
    }
    return true;
  }

  componentDidMount() {
    this.props.block(this.handleBlock);
  }

  componentWillUnmount() {
    this.props.unblock(this.handleBlock);
  }

  render() {
    return null;
  }
}
