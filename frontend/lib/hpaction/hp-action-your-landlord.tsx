import React, { useContext } from "react";
import { AppContext } from "../app-context";
import {
  MiddleProgressStep,
  MiddleProgressStepProps,
} from "../progress/progress-step-route";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { assertNotNull, exactSubsetOrDefault } from "../util/util";
import {
  CheckboxFormField,
  HiddenFormField,
  TextualFormField,
} from "../forms/form-fields";
import { ProgressButtons, BackButton } from "../ui/buttons";
import { Link, useLocation } from "react-router-dom";
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
import { Formset } from "../forms/formset";
import { getQuerystringVar } from "../util/querystring";

const Address: React.FC<{
  primaryLine: string;
  city: string;
  state: string;
  zipCode: string;
}> = (props) => (
  <>
    {props.primaryLine}
    <br />
    {props.city}, {props.state} {props.zipCode}
  </>
);

const ReadOnlyLandlordDetails: React.FC<
  MiddleProgressStepProps & {
    isUserNycha: boolean;
    landlord: RecommendedHpLandlord_recommendedHpLandlord;
    mgmt: RecommendedHpLandlord_recommendedHpManagementCompany | null;
  }
> = (props) => (
  <>
    {props.isUserNycha ? (
      <p>
        Since you are in NYCHA housing, we will be using the following
        information to fill out your HP Action forms.
      </p>
    ) : (
      <p>
        This is your landlord’s information as registered with the{" "}
        <b>NYC Department of Housing and Preservation (HPD)</b>. This may be
        different than where you send your rent checks.
      </p>
    )}
    <QueryLoader
      query={RecommendedHpLandlord}
      input={null}
      loading={(props) => {
        return props.error ? (
          <p>Oops, an error occurred! Try reloading the page.</p>
        ) : (
          <section className="section" aria-hidden="true">
            <div className="jf-loading-overlay">
              <div className="jf-loader" />
            </div>
          </section>
        );
      }}
      render={({
        recommendedHpLandlord: landlord,
        recommendedHpManagementCompany: mgmt,
      }) => {
        landlord = assertNotNull(landlord);
        return (
          <>
            <dl>
              <dt>Landlord name</dt>
              <dd>{landlord.name}</dd>
              <dt>Landlord address</dt>
              <dd>
                <Address {...landlord} />
              </dd>
            </dl>
            {mgmt && (
              <>
                <p>
                  Additionally, your building's HPD registration contains
                  details about your management company.
                </p>
                <dl>
                  <dt>Management company name</dt>
                  <dd>{mgmt.name}</dd>
                  <dt>Management company address</dt>
                  <dd>
                    <Address {...mgmt} />
                  </dd>
                </dl>
              </>
            )}
          </>
        );
      }}
    />
    {props.isUserNycha ? (
      <p>
        If you feel strongly that this information is incorrect, please contact{" "}
        <CustomerSupportLink />.
      </p>
    ) : (
      <p>
        We'll use these details to automatically fill out your HP Action forms.
        If you feel strongly that this information is incorrect, however, you
        can <Link to="?edit=on">provide your own details</Link>.
      </p>
    )}
    <ProgressButtons>
      <BackButton to={props.prevStep} />
      <Link to={props.nextStep} className="button is-primary is-medium">
        Next
      </Link>
    </ProgressButtons>
  </>
);

export const HPActionYourLandlord = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const loc = useLocation();
  const llDetails = session.landlordDetails;
  const isEditable = !!getQuerystringVar(loc.search, "edit");

  return (
    <Page title="Your landlord" withHeading className="content">
      <QueryLoader
        query={RecommendedHpLandlord}
        input={null}
        loading={(props) => {
          return props.error ? (
            <p>Oops, an error occurred! Try reloading the page.</p>
          ) : (
            <section className="section" aria-hidden="true">
              <div className="jf-loading-overlay">
                <div className="jf-loader" />
              </div>
            </section>
          );
        }}
        render={({
          recommendedHpLandlord: landlord,
          recommendedHpManagementCompany: mgmt,
        }) => {
          const useRecommended =
            isUserNycha(session) || (llDetails && llDetails.isLookedUp);
          if (landlord && useRecommended && !isEditable) {
            return (
              <ReadOnlyLandlordDetails
                {...props}
                landlord={landlord}
                mgmt={mgmt}
                isUserNycha={isUserNycha(session)}
              />
            );
          }

          return (
            <SessionUpdatingFormSubmitter
              mutation={HpaLandlordInfoMutation}
              initialState={(session) => ({
                useRecommended: false,
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
                  {landlord ? (
                    <>
                      <CheckboxFormField
                        {...ctx.fieldPropsFor("useRecommended")}
                      >
                        {" "}
                        Use recommended landlord
                        <dl>
                          <dt>Landlord name</dt>
                          <dd>{landlord.name}</dd>
                          <dt>Landlord address</dt>
                          <dd>
                            <Address {...landlord} />
                          </dd>
                        </dl>
                      </CheckboxFormField>
                    </>
                  ) : (
                    <HiddenFormField {...ctx.fieldPropsFor("useRecommended")} />
                  )}
                  <Formset {...ctx.formsetPropsFor("landlord")}>
                    {(formsetCtx) => (
                      <>
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
                      </>
                    )}
                  </Formset>
                  <CheckboxFormField {...ctx.fieldPropsFor("useMgmtCo")}>
                    {" "}
                    I have a management company
                  </CheckboxFormField>
                  <Formset {...ctx.formsetPropsFor("mgmtCo")}>
                    {(formsetCtx) => (
                      <>
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
                      </>
                    )}
                  </Formset>
                  <ProgressButtons
                    back={props.prevStep}
                    isLoading={ctx.isLoading}
                  />
                </>
              )}
            </SessionUpdatingFormSubmitter>
          );
        }}
      />
    </Page>
  );
});
