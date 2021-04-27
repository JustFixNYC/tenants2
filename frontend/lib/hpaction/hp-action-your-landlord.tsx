import React, { useContext } from "react";
import { AppContext } from "../app-context";
import { MiddleProgressStep } from "../progress/progress-step-route";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { exactSubsetOrDefault } from "../util/util";
import {
  CheckboxFormField,
  HiddenFormField,
  TextualFormField,
} from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { Link } from "react-router-dom";
import { USStateFormField } from "../forms/mailing-address-fields";
import { isUserNycha } from "../util/nycha";
import { QueryLoader } from "../networking/query-loader";
import {
  RecommendedHpLandlord,
  RecommendedHpLandlord_recommendedHpLandlord,
  RecommendedHpLandlord_recommendedHpManagementCompany,
} from "../queries/RecommendedHpLandlord";
import { CustomerSupportLink } from "../ui/customer-support-link";
import {
  BlankLandlordLandlordDetailsFormFormSetInput,
  BlankMgmtCoManagementCompanyDetailsFormFormSetInput,
  HpaLandlordInfoMutation,
} from "../queries/HpaLandlordInfoMutation";
import { SingletonFormset } from "../forms/formset";
import { useProgressiveEnhancement } from "../ui/progressive-enhancement";
import {
  LandlordPageContent,
  MailingAddressWithName,
  RecommendedLandlordInfo,
} from "../ui/landlord";

const ReadOnlyLandlordDetails: React.FC<{
  isUserNycha: boolean;
  landlord: RecommendedHpLandlord_recommendedHpLandlord;
  mgmt: RecommendedHpLandlord_recommendedHpManagementCompany | null;
  forceManualHref: string;
}> = ({ isUserNycha, landlord, mgmt, forceManualHref }) => (
  <>
    <RecommendedLandlordInfo
      intro={
        isUserNycha ? (
          <p>
            Since you are in NYCHA housing, we will be using the following
            information to fill out your HP Action forms.
          </p>
        ) : undefined
      }
      landlord={landlord}
    />
    {mgmt && (
      <>
        <p>
          Additionally, your building's HPD registration contains details about
          your management company.
        </p>
        <MailingAddressWithName
          {...mgmt}
          nameLabel="Management company name"
          addressLabel="Management company address"
        />
      </>
    )}
    {isUserNycha ? (
      <p>
        If you feel strongly that this information is incorrect, please contact{" "}
        <CustomerSupportLink />.
      </p>
    ) : (
      <p>
        We'll use these details to automatically fill out your HP Action forms.
        If you feel strongly that this information is incorrect or incomplete,
        however, you can{" "}
        <Link to={forceManualHref}>provide your own details</Link>.
      </p>
    )}
  </>
);

export const HPActionYourLandlord = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const isEnhanced = useProgressiveEnhancement();
  const isNycha = isUserNycha(session);

  return (
    <Page title="Your landlord" withHeading className="content">
      <QueryLoader
        query={RecommendedHpLandlord}
        input={null}
        render={({ recommendedHpLandlord, recommendedHpManagementCompany }) => (
          <LandlordPageContent
            recommendedLandlord={recommendedHpLandlord}
            disallowManualOverride={isNycha}
            renderReadOnlyLandlordDetails={(props) => (
              <ReadOnlyLandlordDetails
                {...props}
                mgmt={recommendedHpManagementCompany}
                isUserNycha={isNycha}
              />
            )}
          >
            {({ useRecommended, toUnforcedHref }) => (
              <SessionUpdatingFormSubmitter
                mutation={HpaLandlordInfoMutation}
                initialState={(session) => ({
                  useRecommended,
                  useMgmtCo: !!session.managementCompanyDetails?.name,
                  landlord: [
                    exactSubsetOrDefault(
                      session.landlordDetails,
                      BlankLandlordLandlordDetailsFormFormSetInput
                    ),
                  ],
                  mgmtCo: [
                    exactSubsetOrDefault(
                      session.managementCompanyDetails,
                      BlankMgmtCoManagementCompanyDetailsFormFormSetInput
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
                            label="Landlord street address"
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("city")}
                            label="Landlord city"
                          />
                          <USStateFormField
                            {...formsetCtx.fieldPropsFor("state")}
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("zipCode")}
                            label="Landlord zip code"
                          />
                        </div>
                      )}
                    </SingletonFormset>
                    {useRecommended ? (
                      <HiddenFormField {...ctx.fieldPropsFor("useMgmtCo")} />
                    ) : (
                      <>
                        <br />
                        <CheckboxFormField {...ctx.fieldPropsFor("useMgmtCo")}>
                          {" "}
                          I have a management company
                        </CheckboxFormField>
                      </>
                    )}
                    <SingletonFormset {...ctx.formsetPropsFor("mgmtCo")}>
                      {(formsetCtx) => (
                        <div
                          className={
                            !useRecommended &&
                            (ctx.fieldPropsFor("useMgmtCo").value ||
                              !isEnhanced)
                              ? ""
                              : "is-hidden"
                          }
                        >
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("name")}
                            label="Management company name"
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("primaryLine")}
                            label="Management company street address"
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("city")}
                            label="Management company city"
                          />
                          <USStateFormField
                            {...formsetCtx.fieldPropsFor("state")}
                          />
                          <TextualFormField
                            {...formsetCtx.fieldPropsFor("zipCode")}
                            label="Management company zip code"
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
