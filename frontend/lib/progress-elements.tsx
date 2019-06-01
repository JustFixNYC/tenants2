import React from 'react';

import { BaseButtonProps, BackButton } from "./buttons";
import { useProgressContext, NextOrPrev, RouteWithProgressContext } from "./progress-context";
import { Link, LinkProps, RouteComponentProps, withRouter } from 'react-router-dom';

type RouterProps = RouteComponentProps<any>;

export const BackToPrevStepButton = withRouter((props: BaseButtonProps & RouterProps) => {
  const { path } = useProgressContext().getRelativeStepStrict(props.location.pathname, 'prev');
  return <BackButton to={path} {...props} />;
});

type ProgressLinkProps = Omit<LinkProps, 'to'> & {
  to: NextOrPrev
};

export const ProgressLink = (props: ProgressLinkProps) => {
  const { to, ...linkProps } = props;
  return <RouteWithProgressContext render={(ctx) => {
    const { path } = ctx.progress.getRelativeStepStrict(ctx.location.pathname, to);
    return <Link to={path} {...linkProps} />;
  }}/>
};
