import React from 'react';
import { ReactElement } from "react";
import { TransitionProps } from "react-transition-group/Transition";
import { assertNotNull, Omit } from './util';
import { TransitionGroup } from 'react-transition-group';

/**
 * This context communicates information about the current
 * animated transition a component may be involved in. This
 * can be used to conditionally render itself differently
 * based on e.g. if it is being animated in or out of
 * the viewport.
 */
export type TransitionContextType = {
  /** The transition the component is currently in, if any. */
  transition: 'none'|'enter'|'exit';
};

const defaultContext: TransitionContextType = {
  transition: 'none',
};

export const TransitionContext = React.createContext<TransitionContextType>(defaultContext);

export type TransitionContextGroupProps = {
  children: ReactElement<TransitionProps> | Array<ReactElement<TransitionProps>>;
  className?: string;
};

function childFactory(child: ReactElement<{ in: boolean }>): ReactElement<any> {
  return <TransitionContext.Provider
    key={assertNotNull(child.key)}
    value={{transition: child.props.in ? 'enter' : 'exit'}}
    children={child}
  />;
}

/**
 * This is just like a <TransitionGroup>, only it provides a custom
 * childFactory that provides each child with a TransitionContext.
 */
export function TransitionContextGroup(props: TransitionContextGroupProps): JSX.Element {
  return <TransitionGroup childFactory={childFactory} {...props} />;
}

/**
 * Higher-order component (HOC) factory function to wrap existing
 * components in a context consumer.
 */
export function withTransitionContext<P extends TransitionContextType>(Component: React.ComponentType<P>): React.ComponentType<Omit<P, keyof TransitionContextType>> {
  return function(props: Omit<P, keyof TransitionContextType>) {
    // https://github.com/Microsoft/TypeScript/issues/28748
    const tsIssue28748Workaround = props as any;
    return (
      <TransitionContext.Consumer>
        {(context) => <Component {...tsIssue28748Workaround} {...context} />}
      </TransitionContext.Consumer>
    );
  }
}
