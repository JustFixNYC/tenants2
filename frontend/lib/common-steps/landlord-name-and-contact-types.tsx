import React from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import {
  TextualFormField,
  CheckboxFormField,
  HiddenFormField,
} from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import { NorentLandlordNameAndContactTypesMutation } from "../queries/NorentLandlordNameAndContactTypesMutation";
import { Accordion } from "../ui/accordion";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
import {
  LandlordPageContent,
  RecommendedLandlordInfo,
  RenderReadOnlyLandlordDetailsOptions,
} from "../ui/landlord";
import { QueryLoader } from "../networking/query-loader";
import { RecommendedLocLandlord } from "../queries/RecommendedLocLandlord";
import { Link } from "react-router-dom";
import { LocLandlordInfoMutation } from "../queries/LocLandlordInfoMutation";
import { SingletonFormset } from "../forms/formset";

const ReadOnlyLandlordDetails: React.FC<
  RenderReadOnlyLandlordDetailsOptions & { children: JSX.Element }
> = ({ landlord, forceManualHref, children }) => {
  return (
    <div className="content">
      <RecommendedLandlordInfo
        intro={
          <>
            <p>
              <Trans>
                This is your landlord’s information as registered with the{" "}
                <b>NYC Department of Housing and Preservation (HPD)</b>. This
                may be different than where you send your rent checks.
              </Trans>
            </p>
            {children}
          </>
        }
        landlord={landlord}
      />
      <Accordion
        question={li18n._(t`This information seems wrong. Can I change it?`)}
      >
        <Trans id="justfix.commonWarningAboutChangingLandlordDetails1">
          If you receive rent-related documents from a different address, or if
          your landlord has instructed you to use a different address for
          correspondence, you can{" "}
          <Link to={forceManualHref}>provide your own details.</Link> But, only
          use a different address if you are absolutely sure it is correct—it is
          safer to use the official address your landlord provided to the city.
        </Trans>
      </Accordion>
    </div>
  );
};

const NameAndContactTypesForm: React.FC<
  MiddleProgressStepProps & {
    children: JSX.Element;
  }
> = (props) => (
  <>
    {props.children}
    <SessionUpdatingFormSubmitter
      mutation={NorentLandlordNameAndContactTypesMutation}
      initialState={(s) => ({
        name: s.landlordDetails?.name || "",
        hasEmailAddress:
          s.norentScaffolding?.hasLandlordEmailAddress ??
          !!s.landlordDetails?.email,
        hasMailingAddress:
          s.norentScaffolding?.hasLandlordMailingAddress ??
          !!s.landlordDetails?.address,
      })}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => (
        <>
          <TextualFormField
            {...ctx.fieldPropsFor("name")}
            label={li18n._(t`Landlord/management company's name`)}
          />
          <Accordion question={li18n._(t`Where do I find this information?`)}>
            <Trans>
              If you write checks or transfer money through your bank to pay
              your rent, use that name here.
            </Trans>
          </Accordion>
          <p>
            <Trans>
              What contact information do you have for your landlord or building
              management?{" "}
              <span className="has-text-weight-bold">
                We recommend choosing both if you have them.
              </span>
            </Trans>
          </p>
          <CheckboxFormField {...ctx.fieldPropsFor("hasEmailAddress")}>
            <Trans>Email address</Trans>
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor("hasMailingAddress")}>
            <Trans>Mailing address</Trans>
          </CheckboxFormField>
          <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
  </>
);

const UseRecommendedLandlord: React.FC<
  MiddleProgressStepProps & {
    toUnforcedHref: string | null;
  }
> = (props) => (
  <SessionUpdatingFormSubmitter
    mutation={LocLandlordInfoMutation}
    initialState={(session) => ({
      useRecommended: true,
      landlord: [],
    })}
    onSuccessRedirect={props.nextStep}
  >
    {(ctx) => (
      <>
        <HiddenFormField {...ctx.fieldPropsFor("useRecommended")} />
        <div className="is-hidden">
          <SingletonFormset {...ctx.formsetPropsFor("landlord")}>
            {(formsetCtx) => {
              throw new Error("This should never render!");
            }}
          </SingletonFormset>
        </div>
        <ProgressButtons
          back={props.toUnforcedHref || props.prevStep}
          isLoading={ctx.isLoading}
        />
      </>
    )}
  </SessionUpdatingFormSubmitter>
);

export const LandlordNameAndContactTypes: React.FC<
  MiddleProgressStepProps & {
    children: JSX.Element;
  }
> = (props) => (
  <Page
    title={li18n._(t`Your landlord or management company's information`)}
    withHeading="big"
    className="content"
  >
    <QueryLoader
      query={RecommendedLocLandlord}
      input={null}
      render={({ recommendedLocLandlord }) => (
        <LandlordPageContent
          recommendedLandlord={recommendedLocLandlord}
          defaultIntro={<></>}
          renderReadOnlyLandlordDetails={(options) => (
            <ReadOnlyLandlordDetails {...options} children={props.children} />
          )}
        >
          {({ useRecommended, toUnforcedHref }) =>
            useRecommended ? (
              <UseRecommendedLandlord
                {...props}
                toUnforcedHref={toUnforcedHref}
              />
            ) : (
              <NameAndContactTypesForm {...props} />
            )
          }
        </LandlordPageContent>
      )}
    />
  </Page>
);
