import React from 'react';

import { BaseButtonProps, BackButton } from "./buttons";
import { useContext } from "react";
import { ProgressContext } from "./progress-context";
import { Link, LinkProps } from 'react-router-dom';

type NextOrPrev = 'next'|'prev';

function getStepPath(which: NextOrPrev): string {
  const ctx = useContext(ProgressContext);
  const step = which === 'next' ? ctx.nextStep : ctx.prevStep;

  // TODO: We should really log a warning if there is no next step,
  // and if we're in development mode, consider throwing an error.
  return step ? step.path : '#';
}

export function BackToPrevStepButton(props: BaseButtonProps): JSX.Element {
  return <BackButton to={getStepPath('prev')} {...props} />;
}

type ProgressLinkProps = Omit<LinkProps, 'to'> & {
  to: NextOrPrev
};

export function ProgressLink(props: ProgressLinkProps): JSX.Element {
  const { to, ...linkProps } = props;
  return <Link to={getStepPath(to)} {...linkProps} />;
}
