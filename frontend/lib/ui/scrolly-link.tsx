import React from "react";
import * as history from "history";
import {
  Link,
  LinkProps,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import { smoothlyScrollToLocation } from "../util/scrolling";
import { resolveLocationDescriptor } from "../util/react-router-util";

export type ScrollyLinkProps = Omit<LinkProps, "onClick">;

/**
 * Like a standard link, but makes sure that the browser always
 * scrolls to the target, even if the target is already the
 * current URL.
 */
export const ScrollyLink = withRouter(
  (props: ScrollyLinkProps & RouteComponentProps) => {
    const { staticContext, ...linkProps } = props;
    const handleClick = () => {
      const toLoc = history.createLocation(
        resolveLocationDescriptor(props.to, props.location),
        undefined,
        undefined,
        props.location
      );
      const loc = props.location;
      if (
        toLoc.pathname === loc.pathname &&
        toLoc.search === loc.search &&
        toLoc.hash === loc.hash
      ) {
        // The page is already at this URL, so nothing's going to smoothly scroll
        // us to where the user wants to go; we'll have to do it ourselves.
        const target = document.getElementById(loc.hash.slice(1));
        if (target) {
          smoothlyScrollToLocation(target);
        }
      }
    };

    return <Link {...linkProps} onClick={handleClick} />;
  }
);
