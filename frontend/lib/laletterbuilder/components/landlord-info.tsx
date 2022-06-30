import { t } from "@lingui/macro";
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
import { WhereDoIFindLandlordInfo } from "../../common-steps/landlord-name-and-contact-types";

export const LaLetterBuilderLandlordNameAddress = MiddleProgressStep(
  (props) => (
    <LandlordNameAddress
      {...props}
      confirmModalRoute={
        LaLetterBuilderRouteInfo.locale.habitability.landlordAddressConfirmModal
      }
    >
      <p>
        This is whoever you send rent to. We'll send your letter directly to
        them.
      </p>
    </LandlordNameAddress>
  )
);

const LandlordNameAddress: React.FC<
  MiddleProgressStepProps & {
    confirmModalRoute: string;
    children: JSX.Element;
  }
> = (props) => (
  <Page
    title={li18n._(t`Who is your landlord or property manager?`)}
    withHeading="big"
    className="content"
  >
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
          <WhereDoIFindLandlordInfo />
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
