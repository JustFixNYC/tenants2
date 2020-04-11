import React from "react";
import { Helmet } from "react-helmet-async";
import { ga } from "./analytics/google-analytics";

type ComponentStackInfo = {
  componentStack: string;
};

export interface ErrorBoundaryProps {
  debug: boolean;
  children: any;
}

type ErrorInfo = {
  isServerSide?: boolean;
  error: string;
  componentStack?: string;
};

type ErrorBoundaryState =
  | ({ hasError: true } & ErrorInfo)
  | { hasError: false };

export function ErrorDebugInfo(props: ErrorInfo): JSX.Element {
  return (
    <React.Fragment>
      <p>
        The error occurred{" "}
        {props.isServerSide ? "on the server" : "in the browser"}.
      </p>
      <h2>Error</h2>
      {!props.isServerSide && (
        <p>
          The following traceback may not have useful line numbers. See your
          browser console for better details.
        </p>
      )}
      <pre>{props.error}</pre>
      {props.componentStack && (
        <React.Fragment>
          <h2>React component stack</h2>
          <pre>{props.componentStack}</pre>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

export function getErrorString(error: any): string {
  if (error) {
    if (typeof error.stack === "string") {
      return error.stack;
    }
    try {
      return error.toString();
    } catch (e) {}
  }
  return "Unknown error";
}

export function ErrorDisplay(
  props: { debug: boolean } & ErrorInfo
): JSX.Element {
  const title = "Alas, a fatal error occurred.";

  return (
    <section className="section">
      <div className="content container">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <h1 className="title">{title}</h1>
        {props.debug && <ErrorDebugInfo {...props} />}
      </div>
    </section>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, info: ComponentStackInfo) {
    const errorString = getErrorString(error);
    this.setState({
      hasError: true,
      error: errorString,
      componentStack: info.componentStack,
    });
    // Unfortunately, it seems like the React error boundary
    // behaves differently in development vs. produciton. In
    // development, it dispatches an error event from the window,
    // which safe mode and other libraries (e.g. Rollbar) can
    // intercept. In production, however, this doesn't seem to
    // occur, so we need to call them manually.
    if (window.SafeMode) {
      window.SafeMode.reportError(error);
    }
    if (window.Rollbar) {
      window.Rollbar.error("ErrorBoundary caught an error!", error);
    }
    ga("send", "exception", {
      exDescription: errorString,
      exFatal: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay debug={this.props.debug} {...this.state} />;
    } else {
      return this.props.children;
    }
  }
}
