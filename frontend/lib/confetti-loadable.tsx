import React from 'react';
import Loadable from 'react-loadable';
import { ConfettiProps } from './confetti';
import { SimpleProgressiveEnhancement } from './progressive-enhancement';

const LoadableConfetti = Loadable({
  loader: () => import(/* webpackChunkName: "confetti" */ './confetti'),
  // We don't want to display anything while the confetti is loading.
  loading() { return null; },
  // This ensures that our server doesn't generate <script> tags
  // to load this component in its static HTML: we don't *want* to block page
  // load on this optional feature.
  modules: [],
  webpack: () => [],
});

export function ProgressiveLoadableConfetti(props: ConfettiProps): JSX.Element {
  return <SimpleProgressiveEnhancement><LoadableConfetti {...props} /></SimpleProgressiveEnhancement>;
}
