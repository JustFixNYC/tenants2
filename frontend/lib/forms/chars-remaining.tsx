import React from "react";
import { SimpleProgressiveEnhancement } from "../ui/progressive-enhancement";
import {
  TextualFormFieldProps,
  TextareaFormField,
  TextualFormField,
} from "./form-fields";
import { Trans, Plural } from "@lingui/macro";

/**
 * Once the user has this percentage of their maximum limit left,
 * we will be more noticeable.
 */
const DANGER_ALERT_PCT = 0.1;

/**
 * If the user has at most this many characters left, we will be
 * more noticeable.
 */
const DANGER_ALERT_MIN_CHARS = 10;

export type CharsRemainingProps = {
  max: number;
  current: number;
  useSpan?: boolean;
};

export function CharsRemaining({
  max,
  current,
  useSpan,
}: CharsRemainingProps): JSX.Element {
  const remaining = max - current;
  const isNoticeable =
    remaining < max * DANGER_ALERT_PCT || remaining <= DANGER_ALERT_MIN_CHARS;
  const el = (
    <Trans
      render={useSpan ? "span" : "p"}
      className={isNoticeable ? "has-text-danger" : undefined}
    >
      <Plural
        value={remaining}
        one="1 character remaining"
        other="# characters remaining"
      />
    </Trans>
  );

  return <SimpleProgressiveEnhancement>{el}</SimpleProgressiveEnhancement>;
}

export function TextareaWithCharsRemaining(
  props: TextualFormFieldProps & {
    maxLength: number;
  }
) {
  return (
    <>
      <TextareaFormField {...props} />
      <CharsRemaining max={props.maxLength} current={props.value.length} />
    </>
  );
}

export function TextualFieldWithCharsRemaining(
  props: TextualFormFieldProps & {
    maxLength: number;
  }
) {
  return (
    <>
      <TextualFormField
        {...props}
        help={
          <CharsRemaining
            useSpan
            max={props.maxLength}
            current={props.value.length}
          />
        }
      />
    </>
  );
}
