import React from 'react';
import { SimpleProgressiveEnhancement } from "./progressive-enhancement";

export type CharsRemainingProps = {
  max: number,
  current: number
};

export function CharsRemaining({ max, current }: CharsRemainingProps): JSX.Element {
  const remaining = max - current;
  const className = remaining < 0 ? 'has-text-danger' : '';
  const text = `${remaining} characters remaining.`;

  return (
    <SimpleProgressiveEnhancement>
      <p className={className}>{text}</p>
    </SimpleProgressiveEnhancement>
  );
}
