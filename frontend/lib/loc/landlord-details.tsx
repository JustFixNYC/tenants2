import React from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { HiddenFormField, TextualFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { exactSubsetOrDefault } from "../util/util";
import { Link } from "react-router-dom";
import { USStateFormField } from "../forms/mailing-address-fields";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { QueryLoader } from "../networking/query-loader";
import { RecommendedLocLandlord } from "../queries/RecommendedLocLandlord";
import { LandlordPageContent, RecommendedLandlordInfo } from "../ui/landlord";
import { LocLandlordInfoMutation } from "../queries/LocLandlordInfoMutation";
import { BlankLandlordLandlordDetailsFormFormSetInput } from "../queries/HpaLandlordInfoMutation";
import { SingletonFormset } from "../forms/formset";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

export const LandlordDetailsPage = MiddleProgressStep((props) => {
  return (
    <Page title={li18n._(t`Landlord information`)} withHeading className="content">
      <QueryLoader
        query={RecommendedLocLandlord}
        input={null}
        render={({ recommendedLocLandlord }) => (
          <LandlordPageContent
            recommendedLandlord={recommendedLocLandlord}
            renderReadOnlyLandlordDetails={(props) => (
              <>
                <RecommendedLandlordInfo {...props} />
                <p>
                  <Trans>
                    We will use this address to ensure your landlord receives your
                    letter. If you feel strongly that this information is
                    incorrect or incomplete, however, you can{" "}
                    <Link to={props.forceManualHref}>
                      provide your own details
                    </Link>
                    .
                  </Trans>
                </p>
              </>
            )}
          >
            {({ useRecommended, toUnforcedHref }) => (
              <SessionUpdatingFormSubmitter
                mutation={LocLandlordInfoMutation}
                initialState={(session) => ({
                  useRecommended,
                  landlord: [
                    exactSubsetOrDefault(
                      session.landlordDetails,
                      BlankLandlordLandlordDetailsFormFormSetInput
                    ),
                  ],
                })}
                onSuccessRedirect={props.nextStep}
              >
                {(ctx) => (
                  <>
                    <HiddenFormField {...ctx.fieldPropsFor("useRecommended")} />
                    <SingletonFormset {...ctx.formsetPropsFor("landlord")}>
                      {(formsetCtx) => (
                        <div className={useRecommended ? "is-hidden" : ""}>
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("name")}
                            label={li18n._(t`Landlord name`)}
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("primaryLine")}
                            label={li18n._(t`Street address`)}
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("city")}
                            label={li18n._(t`City`)}
                          />
                          <USStateFormField
                            {...formsetCtx.fieldPropsFor("state")}
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("zipCode")}
                            label={li18n._(t`Zip code`)}
                          />
                        </div>
                      )}
                    </SingletonFormset>
                    <ProgressButtons
                      nextLabel={li18n._(t`Preview letter`)}
                      back={toUnforcedHref || props.prevStep}
                      isLoading={ctx.isLoading}
                    />
                  </>
                )}
              </SessionUpdatingFormSubmitter>
            )}
          </LandlordPageContent>
        )}
      />
    </Page>
  );
});

export default LandlordDetailsPage;
