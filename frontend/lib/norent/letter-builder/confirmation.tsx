import React, { useContext } from "react";
import Page from "../../ui/page";
import { AppContext } from "../../app-context";

export const NorentConfirmation: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  const letter = session.norentLatestLetter;

  return (
    <Page
      title="Your letter has been sent!"
      withHeading="big"
      className="content"
    >
      <p>Noice.</p>
      {letter?.trackingNumber ? (
        <p>
          Your letter was sent on {letter?.letterSentAt}. Its tracking number is{" "}
          {letter?.trackingNumber}.
        </p>
      ) : (
        <p>Your letter will be sent soon.</p>
      )}
    </Page>
  );
};
