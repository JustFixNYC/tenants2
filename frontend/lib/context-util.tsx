import React from 'react';

import { Omit } from './util';

/**
 * This function returns a higher-order component (HOC) factory function that
 * wraps existing components in a React context consumer.
 * 
 * @param reactContext A react context created via React.createContext().
 */
export function buildContextHocFactory<ContextType>(reactContext: React.Context<ContextType>) {
  return function withContext<P extends ContextType>(Component: React.ComponentType<P>): React.ComponentType<Omit<P, keyof ContextType>> {
    return function (props: Omit<P, keyof ContextType>) {
      // https://github.com/Microsoft/TypeScript/issues/28748
      const tsIssue28748Workaround = props as any;

      return (<reactContext.Consumer>
        {(context) => <Component {...tsIssue28748Workaround} {...context} />}
      </reactContext.Consumer>);
    };
  };
}
