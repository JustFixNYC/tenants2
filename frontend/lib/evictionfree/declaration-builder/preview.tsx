import React from "react";
import { getGlobalAppServerInfo } from "../../app-context";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import Page from "../../ui/page";
import { PdfLink } from "../../ui/pdf-link";

export const EvictionFreePreviewPage = MiddleProgressStep((props) => {
  return (
    <Page
      title="Your declaration is ready to send!"
      withHeading="big"
      className="content"
    >
      <p>
        Before you send your declaration, let's review what will be sent to make
        sure all the information is correct.
      </p>
      <PdfLink
        href={getGlobalAppServerInfo().previewHardshipDeclarationURL}
        label="Preview my declaration"
      />
      <p>TODO: Add email preview and checkboxes for understanding here.</p>
      <ProgressButtonsAsLinks back={props.prevStep} next={props.nextStep} />
    </Page>
  );
});
