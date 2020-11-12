import React, { useContext } from "react";
import { AppContext } from "../app-context";
import { MiddleProgressStep } from "../progress/progress-step-route";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { assertNotNull, exactSubsetOrDefault } from "../util/util";
import {
  CheckboxFormField,
  HiddenFormField,
  TextualFormField,
} from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
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
import { Formset, FormsetProps } from "../forms/formset";
import { getQuerystringVar } from "../util/querystring";
import { useProgressiveEnhancement } from "../ui/progressive-enhancement";

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

const ReadOnlyLandlordDetails: React.FC<{
  isUserNycha: boolean;
  landlord: RecommendedHpLandlord_recommendedHpLandlord;
  mgmt: RecommendedHpLandlord_recommendedHpManagementCompany | null;
}> = ({ isUserNycha, landlord, mgmt }) => (
  <>
    {isUserNycha ? (
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
          Additionally, your building's HPD registration contains details about
          your management company.
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
        <Link to={`?force=${FORCE_MANUAL}`}>provide your own details</Link>.
      </p>
    )}
  </>
);

const FORCE_MANUAL = "manual";
const FORCE_RECOMMENDED = "rec";

/**
 * A formset to use when we know there's only one possible entry
 * for the formset.
 */
function SingletonFormset<FormsetInput extends { id?: string | null }>(
  props: Omit<FormsetProps<FormsetInput>, "maxNum" | "extra">
) {
  return (
    <Formset {...props} maxNum={1} extra={0}>
      {(formsetCtx, i) => {
        // Singleton formset inputs don't care about 'id' properties because
        // the server automatically takes care of them. However, if a legacy
        // POST submission has form errors, we'll get an assertion failure
        // if we don't at least get information about this field, since
        // the rest of the form system will assume it needs to be rendered.
        formsetCtx.fieldPropsFor("id");

        return <>{props.children(formsetCtx, i)}</>;
      }}
    </Formset>
  );
}

export function shouldUseRecommendedLandlordInfo(options: {
  hasRecommendedLandlord: boolean;
  isLandlordAlreadyManuallySpecified: boolean;
  forceManual: boolean;
  forceRecommended: boolean;
}): boolean {
  let useRecommended: boolean;

  if (options.hasRecommendedLandlord) {
    if (options.isLandlordAlreadyManuallySpecified) {
      if (options.forceRecommended) {
        useRecommended = true;
      } else {
        useRecommended = false;
      }
    } else if (options.forceManual) {
      useRecommended = false;
    } else {
      useRecommended = true;
    }
  } else {
    useRecommended = false;
  }

  return useRecommended;
}

export const HPActionYourLandlord = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const loc = useLocation();
  const llDetails = session.landlordDetails;
  const isEnhanced = useProgressiveEnhancement();

  return (
    <Page title="Your landlord" withHeading className="content">
      <QueryLoader
        query={RecommendedHpLandlord}
        input={null}
        render={({
          recommendedHpLandlord: landlord,
          recommendedHpManagementCompany: mgmt,
        }) => {
          const isNycha = isUserNycha(session);
          const forceQs = getQuerystringVar(loc.search, "force");
          const forceManual = forceQs === FORCE_MANUAL && !isNycha;
          const forceRecommended = forceQs === FORCE_RECOMMENDED;
          const isLandlordAlreadyManuallySpecified = !!(
            !llDetails?.isLookedUp &&
            llDetails?.name &&
            llDetails.address
          );
          let useRecommended = shouldUseRecommendedLandlordInfo({
            hasRecommendedLandlord: !!landlord,
            isLandlordAlreadyManuallySpecified,
            forceManual,
            forceRecommended,
          });

          let intro = (
            <p>Please provide us with information on your landlord.</p>
          );

          if (landlord) {
            if (useRecommended) {
              intro = (
                <ReadOnlyLandlordDetails
                  landlord={assertNotNull(landlord)}
                  mgmt={mgmt}
                  isUserNycha={isNycha}
                />
              );
            } else {
              intro = (
                <p>
                  You have chosen to ignore the landlord recommended by
                  JustFix.nyc. Please provide your own details below, or{" "}
                  <Link to={`?force=${FORCE_RECOMMENDED}`}>
                    use the recommended landlord "{landlord.name}"
                  </Link>
                  .
                </p>
              );
            }
          }

          const backHref =
            forceRecommended || forceManual ? loc.pathname : props.prevStep;

          return (
            <SessionUpdatingFormSubmitter
              key={useRecommended.toString()}
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
                  {intro}
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
                          (ctx.fieldPropsFor("useMgmtCo").value || !isEnhanced)
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
                  <ProgressButtons back={backHref} isLoading={ctx.isLoading} />
                </>
              )}
            </SessionUpdatingFormSubmitter>
          );
        }}
      />
    </Page>
  );
});
