import React from 'react';
import classnames from 'classnames';
import { Link, LinkProps } from 'react-router-dom';

export type IconLinkType = 'warning' | 'info';

const ICON_CLASSES: {
  [key in IconLinkType]: string;
} = {
  warning: 'jf-warning-icon',
  info: 'jf-info-icon',
};

const ICON_SVGS: {
  [key in IconLinkType]: JSX.Element;
} = {
  warning: require('./svg/exclamation-circle-solid.svg'),
  info: require('./svg/info-circle-solid.svg'),
};

type IconLinkProps = {
  type: IconLinkType;
  title: string;
} & LinkProps;

export function IconLink(props: IconLinkProps): JSX.Element {
  let { type, ...linkProps } = props;
  linkProps = {
    ...linkProps,
    className: classnames(props.className, ICON_CLASSES[type])
  };
  return (<Link {...linkProps}>
    {ICON_SVGS[type]}
    <aside className="jf-sr-only">{props.title}</aside>
  </Link>);
}
