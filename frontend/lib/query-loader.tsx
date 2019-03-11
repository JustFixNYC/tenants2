import React from 'react';
import { GraphQLFetch } from './graphql-client';
import { RouteComponentProps, Route } from 'react-router';
import { getAppStaticContext } from './app-static-context';
import { AppContextType, AppContext } from './app-context';
import { isDeepEqual } from './util';
import autobind from 'autobind-decorator';
import { MinimalLoadingComponentProps } from './loading-component-props';

export interface QueryLoaderFetch<Input, Output> {
  (fetch: GraphQLFetch, args: Input): Promise<Output>;
}

export interface QueryLoaderQuery<Input, Output> {
  graphQL: string;
  fetch: QueryLoaderFetch<Input, Output>;
}

export interface QueryLoaderProps<Input, Output> {
  /** The GraphQL query to load. */
  query: QueryLoaderQuery<Input, Output>,

  /** The input for the GraphQL query. */
  input: Input,

  /**
   * The render prop that will be called with the query output, once
   * the query has been completed.
   */
  render: (output: Output) => JSX.Element,

  /**
   * The component that will be shown while the query is loading,
   * or if an error occurs.
   */
  loading: React.ComponentType<MinimalLoadingComponentProps>
}

type Props<Input, Output> = QueryLoaderProps<Input, Output> & RouteComponentProps & AppContextType;

type State<Output> = {
  output?: Output,
  error?: any
};

class QueryLoaderWithoutCtx<Input, Output> extends React.Component<Props<Input, Output>, State<Output>> {
  // TODO: Ideally we should be aborting in-flight requests on componentWillUnmount(),
  // but right now our network interface doesn't support that, so we'll just use the
  // workaround suggested in https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html.
  private _isMounted: boolean = false;

  constructor(props: Props<Input, Output>) {
    super(props);
    const state: State<Output> = {};
    const appStaticCtx = getAppStaticContext(props);
    state.output = this.getPrefetchedResponse();
    if (appStaticCtx && !appStaticCtx.graphQLQueryToPrefetch) {
      // We're on the server-side, tell the server to pre-fetch our query.
      appStaticCtx.graphQLQueryToPrefetch = {
        graphQL: props.query.graphQL,
        input: props.input
      };
    }
    this.state = state;
  }

  /* istanbul ignore next: this is tested by integration tests. */
  private getPrefetchedResponse(): Output|undefined {
    const { props } = this;
    const qr = props.server.prefetchedGraphQLQueryResponse;
    if (qr && qr.graphQL === props.query.graphQL && isDeepEqual(qr.input, props.input)) {
      // Our response has been pre-fetched, so we can render the real component.
      return qr.output;
    }
    return undefined;
  }

  @autobind
  retry() {
    this.fetchQuery();
  }

  fetchQuery() {
    this.setState({ error: undefined, output: undefined });
    this.props.query.fetch(this.props.fetch, this.props.input).then((output) => {
      if (this._isMounted) this.setState({ output });
    }).catch(error => {
      if (this._isMounted) this.setState({ error });
    });
  }

  componentDidMount() {
    this._isMounted = true;
    if (typeof(this.state.output) === 'undefined') {
      this.fetchQuery();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { output, error } = this.state;
    if (typeof(output) !== 'undefined') {
      return this.props.render(output);
    } else {
      const Loading = this.props.loading;
      return <Loading error={error} retry={this.retry} />;
    }
  }
}

/**
 * This component fetches a GraphQL query and displays a loading component
 * while doing so.  When running on the server side, it provides a hint
 * to the server to pre-fetch the query; it also renders the loaded
 * query on the server-side if the server has already pre-fetched it.
 */
export class QueryLoader<Input, Output> extends React.Component<QueryLoaderProps<Input, Output>> {
  // Ideally we'd just use react-router's withRouter() HOC factory for this,
  // but it appears to un-genericize our type, so we will do this manually.
  render() {
    return (
      <AppContext.Consumer>
        {(appCtx) => (
          <Route render={(routeProps) => {
            return <QueryLoaderWithoutCtx {...routeProps} {...this.props} {...appCtx} />;
          }} />
        )}
      </AppContext.Consumer>
    );
  }
}
