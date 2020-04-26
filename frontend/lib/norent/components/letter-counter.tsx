import React, { useContext } from "react";
import { AppContext } from "../../app-context";
import { NorentLogo } from "./logo";

// Initial count of norent.org letter sent, based on tally from LA letter sender
const NORENT_LETTERS_SENT_PRE_LAUNCH = 122;

// Initial count of norent.org letter sent, based on tally from LA letter sender
const NUMBER_OF_TIMES_LETTER_COUNTER_INCREMENTS = 20;

export const LetterCounter = () => {
  const { session } = useContext(AppContext);
  return (
    <div className="hero jf-letter-counter">
      <div className="hero-body">
        <div className="container has-text-centered">
          <p className="title is-spaced has-text-info">
            {session.norentLettersSent
              ? NORENT_LETTERS_SENT_PRE_LAUNCH + session.norentLettersSent
              : NORENT_LETTERS_SENT_PRE_LAUNCH}
          </p>
          <NorentLogo size="is-96x96" color="dark" />{" "}
          <span className="subtitle">
            letters sent by tenants across the USA
          </span>
          <p className="is-uppercase">Since May 2020</p>
        </div>
      </div>
    </div>
  );
};
