import { Trans } from "@lingui/macro";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { NorentRoutes } from "../route-info";

export const NorentCannotSendMoreLettersText: React.FC<{}> = () => {
  return (
    <>
      <p>
        <Trans>
          You've already sent letters for all of the months since COVID-19
          started.
        </Trans>
      </p>
      <p>
        <Trans>
          Come back next month to send another letter if you still can't pay
          rent.
        </Trans>
      </p>
    </>
  );
};

export const NorentMoreLettersBlurb: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  if (session.norentAvailableRentPeriods.length === 0) {
    return <NorentCannotSendMoreLettersText />;
  }
  return (
    <>
      <p>
        <Trans>
          You can send an additional letter for other months when you couldn't
          pay rent.
        </Trans>
      </p>
      <p className="has-text-centered">
        <Link
          to={NorentRoutes.locale.letter.landlordName}
          className="button is-primary is-large jf-is-extra-wide"
        >
          <Trans>Send another letter</Trans>
        </Link>
      </p>
    </>
  );
};
