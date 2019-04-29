import React from 'react';
import { SimpleProgressiveEnhancement } from "./progressive-enhancement";

/**
 * Once the user has this percentage of their maximum limit left,
 * we will be more noticeable.
 */
const DANGER_ALERT_PCT = 0.10;

export type CharsRemainingProps = {
  max: number,
  current: number
};

export function CharsRemaining({ max, current }: CharsRemainingProps): JSX.Element {
  const remaining = max - current;
  const className = remaining < (max * DANGER_ALERT_PCT) ? 'has-text-danger' : '';
  const text = `${remaining} character${remaining === 1 ? '' : 's'} remaining.`;

  return (
    <SimpleProgressiveEnhancement>
      <p className={className}>{text}</p>
    </SimpleProgressiveEnhancement>
  );
}
