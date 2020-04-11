import React from "react";
import classnames from "classnames";

import { bulmaClasses, BulmaClassName } from "./bulma";
import { Link, LinkProps } from "react-router-dom";
import { LocationDescriptor } from "history";

type ProgressButtonsOptions =
  | {
      children: JSX.Element[];
    }
  | {
      children?: undefined;
      back: string;
      isLoading: boolean;
      nextLabel?: string;
    };

/**
 * A component that can be used in two different ways:
 *
 *   1. As a container for two child buttons of any type.
 *   2. As a childless component with props that will automatically
 *      render back/next buttons with the most common options.
 */
export function ProgressButtons(props: ProgressButtonsOptions) {
  return (
    <div className="buttons jf-two-buttons">
      {"children" in props ? (
        props.children
      ) : (
        <>
          <BackButton to={props.back} />
          <NextButton isLoading={props.isLoading} label={props.nextLabel} />
        </>
      )}
    </div>
  );
}

/** A back button, meant to go back to the previous step in a flow. */
export function BackButton(props: {
  buttonClass?: BulmaClassName;
  to: LocationDescriptor<any>;
  label?: string;
}): JSX.Element {
  return (
    <Link
      to={props.to}
      className={bulmaClasses(
        "button",
        props.buttonClass || "is-light",
        "is-medium"
      )}
    >
      {props.label || "Back"}
    </Link>
  );
}

/** A next button that submits a form and takes the user to the next step in a flow. */
export function NextButton(props: {
  buttonClass?: BulmaClassName;
  buttonSizeClass?: BulmaClassName;
  isFullWidth?: boolean;
  isLoading: boolean;
  label?: string;
}): JSX.Element {
  return (
    <button
      type="submit"
      className={bulmaClasses(
        "button",
        props.buttonClass || "is-primary",
        props.buttonSizeClass || "is-medium",
        {
          "is-loading": props.isLoading,
          "is-fullwidth": props.isFullWidth,
        }
      )}
    >
      {props.label || "Next"}
    </button>
  );
}

export function CenteredPrimaryButtonLink(props: LinkProps): JSX.Element {
  props = {
    ...props,
    className: classnames(
      props.className,
      bulmaClasses("button", "is-primary", "is-large"),
      "jf-is-extra-wide"
    ),
  };
  return (
    <p className="has-text-centered">
      <Link {...props} />
    </p>
  );
}
