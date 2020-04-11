import React from "react";
import { ConfettiProps } from "./confetti";
import { SimpleProgressiveEnhancement } from "./progressive-enhancement";
import loadable from "@loadable/component";

const LoadableConfetti = loadable(() => import("./confetti"), {
  // We don't want to display anything while the confetti is loading.
  fallback: <></>,
  ssr: false,
});

export function ProgressiveLoadableConfetti(props: ConfettiProps): JSX.Element {
  return (
    <SimpleProgressiveEnhancement>
      <LoadableConfetti {...props} />
    </SimpleProgressiveEnhancement>
  );
}
