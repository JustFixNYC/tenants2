import React from 'react';

import { AllSessionInfo } from "./queries/AllSessionInfo";
import { GraphQLFetch } from "./graphql-client";
import { AppContextType, withAppContext } from './app-context';
import autobind from 'autobind-decorator';

const DEFAULT_INTERVAL_MS = 5000;

type SessionQuery = {
  fetch: (fetch: GraphQLFetch) => Promise<{ session: Partial<AllSessionInfo> }>;
};

export type SessionPollerProps = {
  query: SessionQuery;
  intervalMS?: number;
};

type Props = SessionPollerProps & AppContextType;

class SessionPollerWithoutContext extends React.Component<Props> {
  interval: number|null = null;

  componentDidMount() {
    const ms = this.props.intervalMS || DEFAULT_INTERVAL_MS;
    this.interval = window.setInterval(this.handleInterval, ms);
  }

  componentWillUnmount() {
    if (this.interval !== null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
  }

  @autobind
  handleInterval() {
    this.props.query.fetch(this.props.fetch).then((updates) => {
      this.props.updateSession(updates.session);
    });
  }

  render() {
    return null;
  }
}

export const SessionPoller = withAppContext(SessionPollerWithoutContext);
