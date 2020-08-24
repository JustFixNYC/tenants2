import React from "react";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { useContext } from "react";
import { AppContext } from "../app-context";
import { Route } from "react-router-dom";
import { getAppStaticContext } from "../app-static-context";

type TransformSessionProps<T> = {
  /**
   * A function that converts the session to a different object, returning
   * null if the session doesn't contain enough information to do so.
   */
  transformer: (session: AllSessionInfo) => T | null;

  /**
   * A function that takes the transformed session and returns
   * rendered content.
   */
  children: (props: T) => JSX.Element;
};

/**
 * Transforms the session into a different kind of object,
 * using the given transformer function, and passes it
 * on to the children prop.
 *
 * The transformer can return null, however; if it does,
 * a message indicating that we don't have enough information
 * to generate the content is rendered. Furthermore, if we're
 * rendering a static page, set the HTTP status code to 404, to
 * ensure that we don't e.g. accidentally mail a letter or
 * send an email that contains an error message.
 */
export function TransformSession<T>(props: TransformSessionProps<T>) {
  const { session } = useContext(AppContext);
  const transformedProps = props.transformer(session);

  if (!transformedProps) {
    return <InvalidState />;
  }

  return props.children(transformedProps);
}

const InvalidState: React.FC<{}> = () => (
  <Route
    render={(routerProps) => {
      const staticCtx = getAppStaticContext(routerProps);

      if (staticCtx && staticCtx.staticContent) {
        staticCtx.statusCode = 404;
      }

      return <p>We don't have enough information to generate this content.</p>;
    }}
  />
);
