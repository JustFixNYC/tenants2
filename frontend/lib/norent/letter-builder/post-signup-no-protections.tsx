import React from "react";

import { ProgressStepProps } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { SendCDCDeclarationBlurb } from "../data/faqs-content";

export const PostSignupNoProtections: React.FC<ProgressStepProps> = (props) => {
  return (
    <Page title={li18n._(t`Your account is set up`)} withHeading="big">
      <Trans>
        <p>Your account is set up.</p>
        <p>
          We do not currently recommend sending this notice of non-payment to
          your landlord. <SendCDCDeclarationBlurb />
        </p>
      </Trans>
    </Page>
  );
};
