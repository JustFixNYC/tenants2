import React from 'react';
import classnames from 'classnames';

import { bulmaClasses } from './bulma';
import { Link, LinkProps } from 'react-router-dom';
import { LocationDescriptor } from 'history';

export function BackButton(props: {
  to: LocationDescriptor<any>,
  label?: string
}): JSX.Element {
  return (
    <Link to={props.to} className="button is-text">{props.label || "Cancel and go back"}</Link>
  );
}

export function NextButton(props: {
  isLoading: boolean;
  label?: string;
}): JSX.Element {
  return (
    <button type="submit" className={bulmaClasses('button', 'is-primary', {
      'is-loading': props.isLoading
    })}>{props.label || 'Next'}</button>
  );
}

export function CenteredPrimaryButtonLink(props: LinkProps): JSX.Element {
  props = {
    ...props,
    className: classnames(
      props.className,
      bulmaClasses('button', 'is-primary'),
      'jf-is-extra-wide'
    )
  };
  return (
    <p className="has-text-centered">
      <Link {...props} />
    </p>
  );
}
