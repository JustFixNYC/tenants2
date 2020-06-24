import React from "react";
import Page from "../ui/page";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import * as H from "history";
import { useHistory } from "react-router-dom";

export const RedirectToEnglishPage: React.FC<{ to: H.LocationDescriptor }> = (
  props
) => {
  const history = useHistory();
  const href =
    typeof props.to === "string" ? props.to : history.createHref(props.to);
  const title = li18n._(
    t`The webpage that you want to access is only available in English.`
  );

  return (
    <Page title={title} withHeading="big" className="content">
      <p className="has-text-centered">
        <a href={href} className="button is-primary is-large jf-is-extra-wide">
          <Trans>Got it, take me there</Trans>
        </a>
      </p>
    </Page>
  );
};
