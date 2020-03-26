import React from 'react';
import classnames from 'classnames';
import { Link, LinkProps } from 'react-router-dom';

export type IconType = 'warning' | 'info';

const ICON_CLASSES: {
  [key in IconType]: string;
} = {
  warning: 'jf-warning-icon',
  info: 'jf-info-icon',
};

const ICON_SVGS: {
  [key in IconType]: JSX.Element;
} = {
  warning: require('./svg/exclamation-circle-solid.svg'),
  info: require('./svg/info-circle-solid.svg'),
};

type IconProps = {
  type: IconType;
}

export function Icon(props: IconProps): JSX.Element {
  let { type } = props;
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
