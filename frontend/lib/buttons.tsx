import React from 'react';

import { bulmaClasses } from './bulma';
import { Link } from 'react-router-dom';
import { LocationDescriptor } from 'history';

export function BackButton(props: {
  to: LocationDescriptor<any>
}): JSX.Element {
  return (
    <div className="control">
      <Link to={props.to} className="button is-text">Cancel and go back</Link>
    </div>
  );
}

export function NextButton(props: {
  isLoading: boolean;
  label?: string;
}): JSX.Element {
  return (<div className="control">
    <button type="submit" className={bulmaClasses('button', 'is-primary', {
      'is-loading': props.isLoading
    })}>{props.label || 'Next'}</button>
  </div>);
}
