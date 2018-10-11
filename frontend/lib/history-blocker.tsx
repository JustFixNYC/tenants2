import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import autobind from 'autobind-decorator';
import { UnregisterCallback, Location, Action } from 'history';
import { assertNotNull } from './util';
import { isModalRoute } from './routes';
import { ga } from './google-analytics';


const DEFAULT_PROMPT = (
  "Are you sure you want to leave this page? " +
  "Changes you made may not be saved."
);

export function getNavigationConfirmation(message: string, callback: (result: boolean) => void) {
  const allowTransition = window.confirm(message);
  ga('send', 'event', 'before-navigate', 'confirm', allowTransition ? 'ok' : 'cancel');
  callback(allowTransition);
}

type HistoryBlockerCb = () => boolean;

type HistoryBlockerContextType = {
  block(blockCb: HistoryBlockerCb): void;
  unblock(blockCb: HistoryBlockerCb): void;
};

export const HistoryBlockerContext = React.createContext<HistoryBlockerContextType>({
  block: () => {},
  unblock: () => {}
});

type ManagerProps = RouteComponentProps<any>;

interface ManagerState {  
}

export class HistoryBlockerManagerWithoutRouter extends React.Component<ManagerProps, ManagerState> {
  callbacks: HistoryBlockerCb[];
  unblockHistory: UnregisterCallback|null;

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
    return this.callbacks.some(cb => cb());
  }

  @autobind
  handleBeforeUnload(e: BeforeUnloadEvent): null|string {
    if (this.shouldBlock()) {
      // Cancel the event as defined by the HTML5 standard.
      e.preventDefault();
      // Apparently Chrome needs this.
      e.returnValue = '';
      ga('send', 'event', 'before-unload', 'prevent-default');
      return '';
    }
    return null;
  }

  @autobind
  handleBlock(location: Location, action: Action): string|undefined {
    const fromLocation = this.props.location;
    if (isModalRoute(fromLocation.pathname, location.pathname)) {
      return undefined;
    }
    return this.shouldBlock() ? DEFAULT_PROMPT : undefined;
  }

  componentDidMount() {
    this.unblockHistory = this.props.history.block(this.handleBlock);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  componentWillUnmount() {
    assertNotNull(this.unblockHistory)();
    this.unblockHistory = null;
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  render() {
    return <HistoryBlockerContext.Provider value={{
      block: this.block,
      unblock: this.unblock
    }} children={this.props.children} />
  }
}

export const HistoryBlockerManager = withRouter(HistoryBlockerManagerWithoutRouter);

interface HistoryBlockerProps {
  reportOnly?: boolean;
}

class HistoryBlockerWithoutContext extends React.Component<HistoryBlockerProps & HistoryBlockerContextType> {
  @autobind
  handleBlock(): boolean {
    if (this.props.reportOnly) {
      ga('send', 'event', 'before-navigate', 'no-confirm');
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

export function HistoryBlocker(props: HistoryBlockerProps): JSX.Element {
  return (
    <HistoryBlockerContext.Consumer children={(ctx) => (
      <HistoryBlockerWithoutContext {...ctx} {...props} />
    )} />
  );
}
