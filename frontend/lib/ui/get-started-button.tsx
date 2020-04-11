import React from 'react';
import { CenteredPrimaryButtonLink } from './buttons';
import { GetStartedIntent, getDataLayer, GetStartedPageType } from '../analytics/google-tag-manager';

export const GetStartedButton: React.FC<{
  to: string,
  children: React.ReactNode,
  intent: GetStartedIntent,
  pageType: GetStartedPageType,
}> = props => {
  const handleClick = () => {
    getDataLayer().push({
      event: 'jf.getStarted',
      'jf.getStartedIntent': props.intent,
      'jf.getStartedPageType': props.pageType,
    });
  };

  return (
    <CenteredPrimaryButtonLink to={props.to} className="is-large" onClick={handleClick}>
      {props.children}
    </CenteredPrimaryButtonLink>
  );
};
