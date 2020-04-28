import React, { useContext, useState } from "react";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { AppContext } from "../app-context";

type NullishSessionPredicate = (
  s: AllSessionInfo
) => boolean | null | undefined;

type SessionErrorHandlingPageProps = {
  isInErrorState: NullishSessionPredicate;
  errorComponent: React.ComponentType<{}>;
  children: React.ReactNode;
};

/**
 * A component that conditionally renders either its children or an
 * error component based on whether a criteria is met.
 */
export const SessionErrorHandlingPage: React.FC<SessionErrorHandlingPageProps> = (
  props
) => {
  const currentSession = useContext(AppContext).session;
  const sessionAtMount = useState(currentSession)[0];

  // We're only looking at our session at mount time, because it's possible
  // this page could cause a state transition that makes it impossible for
  // the user to *return* to this page--but we don't want that transition
  // to cause this page to suddenly error!
  if (props.isInErrorState(sessionAtMount)) {
    return React.createElement(props.errorComponent);
  }
  return <>{props.children}</>;
};

/**
 * Wraps the given component in error-handling logic, such
 * that if the current user's session matches a certain
 * error state, a error component is shown instead of the
 * usual one.
 */
export function withSessionErrorHandling<T>(
  isInErrorState: NullishSessionPredicate,
  ErrorComponent: React.ComponentType<{}>,
  Component: React.ComponentType<T>
): (props: T) => JSX.Element {
  return (props) => (
    <SessionErrorHandlingPage
      isInErrorState={isInErrorState}
      errorComponent={ErrorComponent}
    >
      <Component {...props} />
    </SessionErrorHandlingPage>
  );
}
