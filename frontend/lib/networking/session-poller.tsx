import React from 'react';

import { AllSessionInfo } from "../queries/AllSessionInfo";
import { GraphQLFetch } from "./graphql-client";
import { AppContextType, withAppContext } from '../app-context';
import autobind from 'autobind-decorator';
import { Helmet } from 'react-helmet-async';
import { NoScriptFallback } from '../ui/progressive-enhancement';

const DEFAULT_INTERVAL_MS = 5000;

type SessionQuery = {
  fetch: (fetch: GraphQLFetch) => Promise<{ session: Partial<AllSessionInfo> }>;
};

export type SessionPollerProps = {
  query: SessionQuery;
  intervalMS?: number;
  ignoreErrors?: boolean;
};

type Props = SessionPollerProps & AppContextType;

class SessionPollerWithoutContext extends React.Component<Props> {
  interval: number|null = null;

  get intervalMS(): number {
    return this.props.intervalMS || DEFAULT_INTERVAL_MS;
  }

  get intervalSeconds(): number {
    return Math.floor(this.intervalMS / 1000);
  }

  componentDidMount() {
    this.interval = window.setInterval(this.handleInterval, this.intervalMS);
  }

  componentWillUnmount() {
    if (this.interval !== null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
  }

  @autobind
  handleInterval() {
    const { props } =this;
    const fetch = props.ignoreErrors ? props.fetchWithoutErrorHandling : props.fetch;
    props.query.fetch(fetch).then((updates) => {
      this.props.updateSession(updates.session);
    });
  }

  render() {
    return (
      <NoScriptFallback>
        <Helmet>
          <meta http-equiv="refresh" content={this.intervalSeconds.toString()} />
        </Helmet>
      </NoScriptFallback>
    );
  }
}

export const SessionPoller = withAppContext(SessionPollerWithoutContext);
