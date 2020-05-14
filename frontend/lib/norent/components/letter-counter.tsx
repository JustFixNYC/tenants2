import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { NorentLogo } from "./logo";
import { Trans } from "@lingui/macro";

// Initial count of norent.org letter sent, based on tally from LA letter sender
const NORENT_LETTERS_SENT_PRE_LAUNCH = 143;

export const LetterCounter = () => {
  const { session } = useContext(AppContext);

  return (
    <div className="hero jf-letter-counter">
      <div className="hero-body">
        <div className="container has-text-centered">
          <p className="title is-spaced has-text-info">
            {NORENT_LETTERS_SENT_PRE_LAUNCH + session.norentLettersSent}
          </p>
          <Trans>
            <NorentLogo size="is-96x96" color="dark" />{" "}
            <span className="subtitle">
              letters sent by tenants across the USA
            </span>
            <p className="is-uppercase">Since April 2020</p>
          </Trans>
        </div>
      </div>
    </div>
  );
};
