import React from "react";
import classnames from "classnames";

import { bulmaClasses, BulmaClassName } from "./bulma";
import { Link, LinkProps } from "react-router-dom";
import { LocationDescriptorOrResolver } from "../util/react-router-util";

type ProgressButtonsOptions =
  | {
      children: JSX.Element[];
    }
  | {
      children?: undefined;
      back: LocationDescriptorOrResolver<any>;
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

/**
 * A component that renders back/next buttons that function as internal links,
 * as in they don't involve any form submission or mutation.
 */
export function ProgressButtonsAsLinks(props: {
  back: LocationDescriptorOrResolver<any>;
  backLabel?: string;
  next: LocationDescriptorOrResolver<any>;
  nextLabel?: string;
}): JSX.Element {
  return (
    <div className="buttons jf-two-buttons">
      <BackButton to={props.back} label={props.backLabel} />
      <Link
        to={props.next}
        className="button is-primary is-medium jf-is-next-button"
      >
        {props.nextLabel || "Next"}
      </Link>
    </div>
  );
}

/** A back button, meant to go back to the previous step in a flow. */
export function BackButton(props: {
  buttonClass?: BulmaClassName;
  to: LocationDescriptorOrResolver<any>;
  label?: string;
}): JSX.Element {
  return (
    <Link
      to={props.to}
      className={
        "jf-is-back-button " +
        bulmaClasses("button", props.buttonClass || "is-light", "is-medium")
      }
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
      className={
        "jf-is-next-button " +
        bulmaClasses(
          "button",
          props.buttonClass || "is-primary",
          props.buttonSizeClass || "is-medium",
          {
            "is-loading": props.isLoading,
            "is-fullwidth": props.isFullWidth,
          }
        )
      }
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
