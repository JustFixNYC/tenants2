import React from 'react';
import classnames from 'classnames';
import { Link, LinkProps } from 'react-router-dom';

export type IconType = 'warning' | 'notice' | 'info';

const ICON_CLASSES: {
  [key in IconType]: string;
} = {
  // Orange circle with exclamation
  warning: 'jf-warning-icon',

  // Yellow triangle with exclamation
  notice: 'jf-notice-icon',

  // Blue circle with "i" 
  info: 'jf-info-icon',
};

const ICON_SVGS: {
  [key in IconType]: JSX.Element;
} = {
  warning: require('./svg/exclamation-circle-solid.svg'),
  notice: require('./svg/exclamation-triangle-solid.svg'),
  info: require('./svg/info-circle-solid.svg'),
};

type IconProps = {
  type: IconType;
}

export function Icon({type}: IconProps): JSX.Element {
  return (
    <i className={ICON_CLASSES[type]}>
      {ICON_SVGS[type]}
    </i>
  );
}

type IconLinkProps = {
  type: IconType;
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
