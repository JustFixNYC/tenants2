import React from "react";
import ReactDOM from "react-dom";

import { SessionUpdatingFormSubmitter } from "./session-updating-form-submitter";
import { ClearAnonymousSessionMutation } from "../queries/ClearAnonymousSessionMutation";
import { ProgressiveEnhancement } from "../ui/progressive-enhancement";
import { bulmaClasses } from "../ui/bulma";
import { FormContext } from "./form-context";
import { LogoutInput } from "../queries/globalTypes";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";

const getDefaultLabel = () => li18n._(t`Cancel`);

export type ClearAnonymousSessionButtonProps = {
  /** The route to redirect the user to after they click the button. */
  to: string;
  /** Whether to disable progressive enhancement. */
  disableProgressiveEnhancement?: boolean;
  /**
   * A React ref pointing to the container element to inject a button into,
   * in the progressively enhanced version of this component.
   */
  portalRef: React.RefObject<HTMLElement>;
  /** The button's label. Defaults to "Cancel". */
  label?: string;
};

/**
 * During experiences in which the user may not be logged in, we
 * want to provide some mechanism for them to clear the session
 * so sensitive data isn't exposed to subsequent users of their
 * device's browser (e.g., a computer in a public library).
 *
 * This is complicated, however, by the fact that we often want
 * this mechanism to be represented as a "cancel" button in a form,
 * while actually submitting a completely different form than the
 * one they're being asked to fill out. HTML5 supports this via the
 * <button> element's "form" attribute, but not all browsers support
 * that. Therefore, the usage of this component is a bit unusual,
 * and involves the following:
 *
 *   1. In your form, add a container with a `ref`. In
 *      progressively enhanced scenarios, the cancel button will be
 *      injected into this container after the page loads.
 *
 *   2. Render this component *outside* of the form you want it
 *      to appear in, but as close to the form as possible. In
 *      the baseline experience, this is where the cancel button
 *      will appear. It won't be ideal, but hopefully not many
 *      users will see this version.
 */
export function ClearAnonymousSessionButton(
  props: ClearAnonymousSessionButtonProps
) {
  const label = props.label || getDefaultLabel();

  return (
    <SessionUpdatingFormSubmitter
      mutation={ClearAnonymousSessionMutation}
      initialState={{}}
      onSuccessRedirect={props.to}
    >
      {(ctx) => (
        <ProgressiveEnhancement
          disabled={props.disableProgressiveEnhancement}
          renderBaseline={() => (
            <button type="submit" className="button is-light">
              {label}
            </button>
          )}
          renderEnhanced={() => {
            if (!props.portalRef.current)
              throw new Error("portalRef must exist!");
            return ReactDOM.createPortal(
              createButton(label, ctx),
              props.portalRef.current
            );
          }}
        />
      )}
    </SessionUpdatingFormSubmitter>
  );
}

function createButton(label: string, ctx: FormContext<LogoutInput>) {
  return (
    <button
      type="button"
      onClick={() => ctx.submit()}
      className={bulmaClasses("button", "is-light", "is-medium", {
        "is-loading": ctx.isLoading,
      })}
    >
      {label}
    </button>
  );
}

/**
 * A much simpler clearing session button that doesn't require
 * React Portals, if you don't need to put it on an existing form.
 */
export const SimpleClearAnonymousSessionButton: React.FC<Pick<
  ClearAnonymousSessionButtonProps,
  "to" | "label"
>> = (props) => {
  return (
    <SessionUpdatingFormSubmitter
      mutation={ClearAnonymousSessionMutation}
      initialState={{}}
      onSuccessRedirect={props.to}
      children={createButton.bind(null, props.label || getDefaultLabel())}
    />
  );
};
