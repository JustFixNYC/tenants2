import React, { useContext } from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { BackButton } from "../../ui/buttons";
import {
  getUSStateChoiceLabels,
  USStateChoice,
} from "../../../../common-data/us-state-choices";

export const NorentLbKnowYourRights = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const state = session.norentScaffolding?.state as USStateChoice;
  return (
    <Page title="Know your rights">
      <h2 className="title">
        Looks like you're in{" "}
        <span className="has-text-info">
          {state && getUSStateChoiceLabels()[state]}
        </span>
      </h2>

      <p>
        Tenants in Florida are protected from eviction for non-payment by
        Executive Order 20-94, issued by Governor Ron DeSantis until May 17,
        2020.
      </p>
      <p>
        We’ve partnered with Community Justice Partners to provide additional
        support once you’ve sent your letter.
      </p>
      <br />
      <div className="buttons jf-two-buttons">
        <BackButton to={props.prevStep} />
        <Link
          to={props.nextStep}
          className="button is-primary is-medium jf-is-next-button"
        >
          Next
        </Link>
      </div>
    </Page>
  );
});
