import { Trans } from "@lingui/macro";
import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppLocationDescriptor, makeAppLocation } from "../app-location";
import { usePrevious } from "../util/use-previous";
import { bulmaClasses } from "./bulma";
import { useAutoFocus } from "./use-auto-focus";

const EditLink: React.FC<{
  path: string;
  hashId?: string;
  ariaLabel: string;
  autoFocus?: boolean;
}> = ({ path, hashId, ariaLabel, autoFocus }) => {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useAutoFocus(ref, autoFocus);

  return (
    <Link
      to={makeAppLocation({
        pathname: path,
        hash: hashId,
        state: { noFocus: true, noScroll: true },
      })}
      className="button is-primary"
      aria-label={ariaLabel}
      ref={ref}
    >
      <Trans>Edit</Trans>
    </Link>
  );
};

export type EditableInfoProps = {
  /**
   * The path that clicking the "edit" button should take the
   * user to. This should be a path in which this button will
   * still be rendered without needing to be re-mounted.
   */
  path: string;

  /**
   * The hash ID that clicking the "edit" button
   * should take the user to, if any. This can ensure that
   * the browser automatically scrolls to the part of the
   * page where the editable information is.
   *
   * Note that this should be the hash *without* the leading
   * `#` character, e.g. `mysection` rather than `#mysection`.
   */
  hashId?: string;

  /**
   * The name of the information in this area, used for
   * providing an accessible label for the "edit" button
   * (there may be multiple "edit" buttons on the page, so
   * we want to provide more context for screen reader users).
   */
  name: string;

  /** The read-only version of the content. */
  readonlyContent: string | JSX.Element;

  /**
   * The content shown when the user clicks the "edit" button.
   * This content is responsible for focusing itself on mount
   * to ensure that user focus isn't lost, as the "edit" button
   * will have disappeared.
   *
   * This content can also contain a link or redirect back to the URL with
   * the read-only version of the content, which is expected
   * to be a subset of the `path` prop.  Once this is navigated to,
   * the `children` will be unmounted and this component will ensure
   * that the "edit" button is focused.
   */
  children: any;
};

/**
 * A section of information that starts out read-only, but
 * becomes editable once the user activates an "edit" button.
 *
 * The "edit" button is actually just a link to a URL that
 * toggles the editability of the content. This is done to
 * ensure that the functionality works in non-JS contexts.
 */
export const EditableInfo: React.FC<EditableInfoProps> = (props) => {
  const { pathname } = useLocation();
  const prevPathname = usePrevious(pathname);
  let autoFocusEditLink =
    pathname !== prevPathname &&
    prevPathname?.startsWith(props.path) &&
    // We additionally want to make sure that we only auto-focus
    // the edit link in situations where we are sure nothing else
    // wants focus, which by convention will be if our pathname
    // starts with the current pathname (e.g. if the user just
    // navigated from `/foo/edit-name` to `/foo`, rather than from
    // `/foo/edit-name` to `/foo/edit-phone-number`).
    props.path.startsWith(pathname);

  return pathname.startsWith(props.path) ? (
    props.children
  ) : (
    <>
      {typeof props.readonlyContent == "string" ? (
        <input
          disabled
          className="input jf-editable-info"
          value={props.readonlyContent}
        />
      ) : (
        <div className="jf-editable-info">{props.readonlyContent}</div>
      )}
      <EditLink
        {...props}
        autoFocus={autoFocusEditLink}
        ariaLabel={`Edit ${props.name}`}
      />
    </>
  );
};

/**
 * Save/cancel buttons, originally intended for use within an `<EditableInfo>`.
 */
export const SaveCancelButtons: React.FC<{
  isLoading: boolean;
  homeLocation: AppLocationDescriptor;
}> = ({ isLoading, homeLocation }) => {
  return (
    <>
      <button
        type="submit"
        className={bulmaClasses("button", "is-primary", {
          "is-loading": isLoading,
        })}
      >
        <Trans>Save</Trans>
      </button>{" "}
      <Link to={homeLocation} className="button is-light">
        <Trans>Cancel</Trans>
      </Link>
    </>
  );
};
