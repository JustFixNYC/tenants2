import React from 'react';
import classnames from 'classnames';

import { bulmaClasses, BulmaClassName } from './bulma';
import { Link, LinkProps } from 'react-router-dom';
import { LocationDescriptor } from 'history';

export function BackButton(props: {
  buttonClass?: BulmaClassName;
  to: LocationDescriptor<any>;
  label?: string
}): JSX.Element {
  return (
    <Link to={props.to} className={bulmaClasses('button', props.buttonClass || 'is-light', 'is-medium')}>
      {props.label || "Cancel and go back"}</Link>
  );
}

export function NextButton(props: {
  buttonClass?: BulmaClassName;
  isLoading: boolean;
  label?: string;
}): JSX.Element {
  return (
    <button type="submit" className={bulmaClasses('button', props.buttonClass || 'is-primary', 'is-medium', {
      'is-loading': props.isLoading
    })}>{props.label || 'Next'}</button>
  );
}

export function CenteredPrimaryButtonLink(props: LinkProps): JSX.Element {
  props = {
    ...props,
    className: classnames(
      props.className,
      bulmaClasses('button', 'is-primary', 'is-large'),
      'jf-is-extra-wide'
    )
  };
  return (
    <p className="has-text-centered">
      <Link {...props} />
    </p>
  );
}
