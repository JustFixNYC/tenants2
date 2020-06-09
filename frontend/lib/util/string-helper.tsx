import React from "react";

type StringHelper<T> = (props: T) => string;

interface StringHelperFC<T> {
  (fn: StringHelper<T>): React.FC<T>;
}

function stringHelperFC<T>(fn: StringHelper<T>): React.FC<T> {
  return (props) => <>{fn(props)}</>;
}

/**
 * Some helper functions that build strings out of props
 * are slightly easier to read as components, so this function
 * makes it easier to converts such a helper to a component.
 */
export function makeStringHelperFC<T>(): StringHelperFC<T> {
  // Note that technically this incurs a runtime penalty and we
  // could do this via TypeScript, but it'd be relatively
  // verbose, so we're just doing this instead.
  return stringHelperFC;
}
