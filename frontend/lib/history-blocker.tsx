import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import autobind from 'autobind-decorator';
import { UnregisterCallback, Location, Action } from 'history';
import { assertNotNull } from './util';
import { isModalRoute } from './routes';


type HistoryBlockerCb = () => string|false|undefined;

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

class HistoryBlockerManagerWithoutRouter extends React.Component<ManagerProps, ManagerState> {
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

  @autobind
  handleBeforeUnload(e: BeforeUnloadEvent): null|string {
    const blockResult = this.handleBlock();
    if (typeof(blockResult) === 'string') {
      e.preventDefault();
      e.returnValue = blockResult;
      return blockResult;
    }
    return null;
  }

  @autobind
  handleBlock(location?: Location, action?: Action): string|false|undefined {
    if (location && action) {
      const fromLocation = this.props.location;
      if (isModalRoute(fromLocation.pathname, location.pathname)) {
        return undefined;
      }
    }
    for (let cb of this.callbacks) {
      const result = cb();
      if (result) return result;
    }
    return undefined;
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

interface HistoryBlockerProps extends HistoryBlockerContextType {
  onBlock: HistoryBlockerCb;
}

class HistoryBlockerWithoutContext extends React.Component<HistoryBlockerProps> {
  @autobind
  handleBlock(): string|false|undefined {
    return this.props.onBlock();
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

export function HistoryBlocker(props: { onBlock: HistoryBlockerCb }): JSX.Element {
  return (
    <HistoryBlockerContext.Consumer children={(ctx) => {
      const fullProps = {...ctx, ...props};
      return <HistoryBlockerWithoutContext {...fullProps} />
    }} />
  );
}
