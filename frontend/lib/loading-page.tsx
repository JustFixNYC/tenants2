import React from 'react';
import Loadable from 'react-loadable';
import Page from './page';

export const IMPERCEPTIBLE_MS = 10;
export const FRIENDLY_LOAD_MS = 5000;

export function LoadingPage(props: Loadable.LoadingComponentProps): JSX.Element {
  if (props.error) {
    return (<Page title="Network error">
      <p>Unfortunately, a network error occurred.</p>
      <br />
      <button className="button" onClick={props.retry}>Retry</button>
    </Page>);
  }
  return <Page title="Loading...">Loading...</Page>;
}

export function friendlyLoad<T>(promise: Promise<T>): Promise<T> {
  if (typeof (window) === 'undefined') {
    return promise;
  }

  const start = Date.now();

  return new Promise<T>((resolve) => {
    promise.finally(() => {
      const timeElapsed = Date.now() - start;
      if (timeElapsed < IMPERCEPTIBLE_MS || timeElapsed >= FRIENDLY_LOAD_MS) {
        resolve(promise);
      } else {
        const ms = FRIENDLY_LOAD_MS - timeElapsed;
        window.setTimeout(() => resolve(promise), ms);
      }
    });
  });
}
