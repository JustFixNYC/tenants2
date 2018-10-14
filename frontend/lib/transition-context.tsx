import React from 'react';
import { ReactElement } from "react";
import { TransitionProps } from "react-transition-group/Transition";
import { assertNotNull, Omit } from './util';
import { TransitionGroup } from 'react-transition-group';

export type TransitionContextType = {
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

export function TransitionContextGroup(props: TransitionContextGroupProps): JSX.Element {
  return <TransitionGroup childFactory={childFactory} {...props} />;
}

/**
 * Higher-order component (HOC) factory function to wrap existing
 * components in a context consumer.
 */
export function withTransitionContext<P extends TransitionContextType>(Component: React.ComponentType<P>): React.ComponentType<Omit<P, keyof TransitionContextType>> {
  return function(props: Omit<P, keyof TransitionContextType>) {
    return (
      <TransitionContext.Consumer>
        {(context) => <Component {...props} {...context} />}
      </TransitionContext.Consumer>
    );
  }
}
