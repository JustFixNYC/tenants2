import { t, Trans } from "@lingui/macro";
import React from "react";
import { Route } from "react-router-dom";
import { TextualFormField } from "../../forms/form-fields";
import { USStateFormField } from "../../forms/mailing-address-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { li18n } from "../../i18n-lingui";
import {
  MiddleProgressStep,
  MiddleProgressStepProps,
} from "../../progress/progress-step-route";
import { ConfirmAddressModal } from "../../common-steps/landlord-mailing-address";
import { ProgressButtons } from "../../ui/buttons";
import { DemoDeploymentNote } from "../../ui/demo-deployment-note";
import Page from "../../ui/page";
import { LaLetterBuilderRouteInfo } from "../route-info";
import {
  BlankLandlordNameAddressInput,
  LandlordNameAddressMutation,
} from "../../queries/LandlordNameAddressMutation";
import { exactSubsetOrDefault } from "../../util/util";
import { Accordion } from "../../ui/accordion";
import ResponsiveElement from "./responsive-element";
import { logEvent } from "../../analytics/util";
import { ga } from "../../analytics/google-analytics";
import { LocalizedOutboundLink } from "../../ui/localized-outbound-link";

export const LaLetterBuilderLandlordNameAddress = MiddleProgressStep(
  (props) => (
    <LandlordNameAddress
      {...props}
      confirmModalRoute={
        LaLetterBuilderRouteInfo.locale.habitability.landlordAddressConfirmModal
      }
    >
      <ResponsiveElement className="mt-3 mb-9" desktop="h4" touch="h3">
        This is whoever you send rent to. We'll send your letter directly to
        them.
      </ResponsiveElement>
    </LandlordNameAddress>
  )
);

const LandlordNameAddress: React.FC<
  MiddleProgressStepProps & {
    confirmModalRoute: string;
    children: JSX.Element;
  }
> = (props) => (
  <Page title={li18n._(t`Who is your landlord or property manager?`)}>
    <ResponsiveElement desktop="h3" touch="h1">
      <Trans>Who is your landlord or property manager?</Trans>
    </ResponsiveElement>
    <NameAddressForm {...props} />
  </Page>
);

const NameAddressForm: React.FC<
  MiddleProgressStepProps & {
    confirmModalRoute: string;
    children: JSX.Element;
  }
> = (props) => (
  <>
    {props.children}
    <DemoDeploymentNote>
      <p>
        This demo site <strong>will not send</strong> real mail or email to your
        landlord at the addresses provided below.
      </p>
    </DemoDeploymentNote>

    <SessionUpdatingFormSubmitter
      mutation={LandlordNameAddressMutation}
      initialState={(s) => ({
        ...exactSubsetOrDefault(
          s.landlordDetails,
          BlankLandlordNameAddressInput
        ),
      })}
      onSuccessRedirect={(output) =>
        output.isUndeliverable ? props.confirmModalRoute : props.nextStep
      }
    >
      {(ctx) => (
        <>
          <TextualFormField
            {...ctx.fieldPropsFor("name")}
            label={li18n._(t`Landlord or property manager name`)}
          />
          <TextualFormField
            {...ctx.fieldPropsFor("primaryLine")}
            label={li18n._(t`Street address`)}
          />
          <TextualFormField
            {...ctx.fieldPropsFor("city")}
            label={li18n._(t`City`)}
          />
          <USStateFormField {...ctx.fieldPropsFor("state")} />
          <TextualFormField
            {...ctx.fieldPropsFor("zipCode")}
            label={li18n._(t`Zip code`)}
          />
          <Accordion
            question={li18n._(
              t`Where do I find this information about my landlord or property manager?`
            )}
            extraClassName=""
            questionClassName="is-size-6 jf-has-text-underline"
            onClick={(isExpanded) => {
              logEvent("ui.accordion.click", {
                label: "find-landlord-info",
                isExpanded,
              });
              ga(
                "send",
                "event",
                "accordion",
                isExpanded ? "show" : "hide",
                "find-landlord-info"
              );
            }}
          >
            <div className="content">
              <Trans id="laletterbuilder.landlord.whereToFindInfo">
                By law your landlord is required to provide contact information.
                If you’re unable to get this information, attend the{" "}
                <LocalizedOutboundLink
                  hrefs={{
                    en: "https://www.saje.net/what-we-do/tenant-action-clinic/",
                    es:
                      "https://espanol.saje.net/que-hacemos/clinica-de-accion-de-inquilinos/",
                  }}
                >
                  Tenant Action Clinic
                </LocalizedOutboundLink>{" "}
                to get help.
              </Trans>
            </div>
          </Accordion>
          <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
        </>
      )}
    </SessionUpdatingFormSubmitter>

    <Route
      path={props.confirmModalRoute}
      render={() => <ConfirmAddressModal nextStep={props.nextStep} />}
    />
  </>
);
