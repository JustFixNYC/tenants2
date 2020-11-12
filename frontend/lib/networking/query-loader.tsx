import React from "react";
import { RouteComponentProps, Route } from "react-router";
import { AppContextType, AppContext } from "../app-context";
import autobind from "autobind-decorator";
import { RetryableLoadingComponentProps } from "./loading-component-props";
import {
  QueryLoaderQuery,
  QueryLoaderPrefetcher,
} from "./query-loader-prefetcher";

export interface QueryLoaderProps<Input, Output> {
  /** The GraphQL query to load. */
  query: QueryLoaderQuery<Input, Output>;

  /** The input for the GraphQL query. */
  input: Input;

  /**
   * The render prop that will be called with the query output, once
   * the query has been completed.
   */
  render: (output: Output) => JSX.Element;

  /**
   * The component that will be shown while the query is loading,
   * or if an error occurs. If not specified, a default
   * component will be shown.
   */
  loading?: React.ComponentType<RetryableLoadingComponentProps>;
}

type Props<Input, Output> = QueryLoaderProps<Input, Output> &
  RouteComponentProps &
  AppContextType;

type State<Output> = {
  output?: Output;
  error?: any;
};

class QueryLoaderWithoutCtx<Input, Output> extends React.Component<
  Props<Input, Output>,
  State<Output>
> {
  // TODO: Ideally we should be aborting in-flight requests on componentWillUnmount(),
  // but right now our network interface doesn't support that, so we'll just use the
  // workaround suggested in https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html.
  private _isMounted: boolean = false;

  constructor(props: Props<Input, Output>) {
    super(props);
    const qlp = new QueryLoaderPrefetcher(
      props,
      props,
      props.query,
      props.input
    );

    qlp.maybeQueueForPrefetching();
    this.state = {
      output: qlp.prefetchedResponse,
    };
  }

  @autobind
  retry() {
    this.fetchQuery();
  }

  fetchQuery() {
    this.setState({ error: undefined, output: undefined });
    this.props.query
      .fetch(this.props.fetch, this.props.input)
      .then((output) => {
        if (this._isMounted) this.setState({ output });
      })
      .catch((error) => {
        if (this._isMounted) this.setState({ error });
      });
  }

  componentDidMount() {
    this._isMounted = true;
    if (typeof this.state.output === "undefined") {
      this.fetchQuery();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { output, error } = this.state;
    if (typeof output !== "undefined") {
      return this.props.render(output);
    } else {
      const Loading = this.props.loading || DefaultLoadingComponent;
      return <Loading error={error} retry={this.retry} />;
    }
  }
}

const DefaultLoadingComponent: React.FC<RetryableLoadingComponentProps> = (
  props
) => {
  return props.error ? (
    <p>Oops, an error occurred! Try reloading the page.</p>
  ) : (
    <section className="section" aria-hidden="true">
      <div className="jf-loading-overlay">
        <div className="jf-loader" />
      </div>
    </section>
  );
};

/**
 * This component fetches a GraphQL query and displays a loading component
 * while doing so.  When running on the server side, it provides a hint
 * to the server to pre-fetch the query; it also renders the loaded
 * query on the server-side if the server has already pre-fetched it.
 */
export class QueryLoader<Input, Output> extends React.Component<
  QueryLoaderProps<Input, Output>
> {
  // Ideally we'd just use react-router's withRouter() HOC factory for this,
  // but it appears to un-genericize our type, so we will do this manually.
  render() {
    return (
      <AppContext.Consumer>
        {(appCtx) => (
          <Route
            render={(routeProps) => {
              return (
                <QueryLoaderWithoutCtx
                  {...routeProps}
                  {...this.props}
                  {...appCtx}
                />
              );
            }}
          />
        )}
      </AppContext.Consumer>
    );
  }
}
