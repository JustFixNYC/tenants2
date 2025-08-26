import React from "react";
import Page from "../../../ui/page";
import { ProgressButtons } from "../../../ui/buttons";
import { t, Trans } from "@lingui/macro";
import { li18n } from "../../../i18n-lingui";
import { SessionUpdatingFormSubmitter } from "../../../forms/session-updating-form-submitter";
import { AllSessionInfo } from "../../../queries/AllSessionInfo";
import { LetterSenderOverchargeDetailsMutation } from "../../../queries/LetterSenderOverchargeDetailsMutation";
import ResponsiveElement from "../../components/responsive-element";
import { ProgressStepProps } from "../../../progress/progress-step-route";

export const OverchargePage: React.FC<ProgressStepProps> = (props) => {
  const getInitialState = (session: AllSessionInfo) => ({
    overchargeApplies: session.overchargeDetails || false,
  });

  return (
    <Page title={li18n._(t`Overcharge Details`)}>
      <ResponsiveElement className="mb-5" desktop="h3" touch="h1">
        <Trans>Overcharge Details</Trans>
      </ResponsiveElement>

      <ResponsiveElement desktop="h4" touch="h3">
        <Trans>
          Please provide additional details about your overcharge situation.
        </Trans>
      </ResponsiveElement>

      <div>
        <SessionUpdatingFormSubmitter
          confirmNavIfChanged
          mutation={LetterSenderOverchargeDetailsMutation}
          initialState={getInitialState}
          onSuccessRedirect={props.nextStep || ""}
        >
          {(ctx) => (
            <>
              <div className="mt-11">
                <div className="field">
                  <label className="label">
                    <Trans>
                      Do the following apply to your overcharge situation?
                    </Trans>
                  </label>
                  <ul>
                    <li>
                      <Trans>
                        - Your rent increase happened after April 20, 2024
                      </Trans>
                    </li>
                    <li>
                      <Trans>
                        - Your rent increase is more than your current/previous
                        monthly rent + 8.79% (Link to rent calc on GCE)
                      </Trans>
                    </li>
                  </ul>
                  <div className="control">
                    <div className="buttons">
                      <button
                        type="button"
                        className={`button is-large ${
                          ctx.fieldPropsFor("overchargeApplies").value === true
                            ? "is-primary"
                            : "is-outlined"
                        }`}
                        onClick={() => {
                          ctx.fieldPropsFor("overchargeApplies").onChange(true);
                        }}
                      >
                        <Trans>Yes</Trans>
                      </button>
                      <button
                        type="button"
                        className={`button is-large ${
                          ctx.fieldPropsFor("overchargeApplies").value === false
                            ? "is-primary"
                            : "is-outlined"
                        }`}
                        onClick={() => {
                          ctx
                            .fieldPropsFor("overchargeApplies")
                            .onChange(false);
                        }}
                      >
                        <Trans>No</Trans>
                      </button>
                    </div>
                  </div>
                  {ctx.fieldPropsFor("overchargeApplies").errors && (
                    <p className="help is-danger">
                      {
                        ctx.fieldPropsFor("overchargeApplies").errors?.[0]
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>

              <ProgressButtons
                isLoading={ctx.isLoading}
                back={props.prevStep || ""}
              />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
};
