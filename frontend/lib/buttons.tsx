import React from 'react';

import { bulmaClasses } from './bulma';
import { Link } from 'react-router-dom';
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
