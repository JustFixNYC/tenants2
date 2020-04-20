import React from "react";
import Page from "../../ui/page";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { LetterPreview } from "../../static-page/letter-preview";
import { NorentRoutes } from "../routes";
import { BackButton } from "../../ui/buttons";
import { assertNotNull } from "../../util/util";
import { OutboundLink } from "../../analytics/google-analytics";

export const NorentLetterPreviewPage: React.FC<ProgressStepProps> = (props) => {
  const prevStep = assertNotNull(props.prevStep);
  const { letterContent } = NorentRoutes.locale;

  return (
    <Page title="Almost there!" withHeading="big" className="content">
      <p>
        Before you send your letter, let's review what will be sent to make sure
        all the information is correct.
      </p>
      <p>Here's a preview of the letter.</p>
      <LetterPreview
        title="Preview of your NoRent.org letter"
        src={letterContent.html}
      />
      <p>
        You can also{" "}
        <OutboundLink href={letterContent.pdf} target="_blank">
          view this letter as a PDF
        </OutboundLink>
        .
      </p>
      <br />
      <BackButton to={prevStep} />
    </Page>
  );
};
