import React from "react";

export type StringHelper<T> = (props: T) => string;

export interface StringHelperFC<T> {
  (fn: StringHelper<T>): React.FC<T>;
}

/**
 * Some of our helper functions that build strings out of our props
 * are slightly easier to read as components, so this function
 * just converts a helper to a component.
 */
export function stringHelperFC<T>(fn: StringHelper<T>): React.FC<T> {
  return (props) => <>{fn(props)}</>;
}
