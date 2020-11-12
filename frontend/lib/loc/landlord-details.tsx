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

export const LandlordDetailsPage = MiddleProgressStep((props) => {
  return (
    <Page title="Landlord information" withHeading className="content">
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
                  We will use this address to ensure your landlord receives your
                  letter. If you feel strongly that this information is
                  incorrect or incomplete, however, you can{" "}
                  <Link to={props.forceManualHref}>
                    provide your own details
                  </Link>
                  .
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
                            label="Landlord name"
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("primaryLine")}
                            label="Street address"
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("city")}
                            label="City"
                          />
                          <USStateFormField
                            {...formsetCtx.fieldPropsFor("state")}
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("zipCode")}
                            label="Zip code"
                          />
                        </div>
                      )}
                    </SingletonFormset>
                    <ProgressButtons
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
