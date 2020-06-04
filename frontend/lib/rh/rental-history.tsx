import React, { useContext, useRef } from "react";

import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress/progress-routes";
import JustfixRoutes from "../justfix-routes";
import Page from "../ui/page";
import { StaticImage } from "../ui/static-image";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { RhFormMutation, BlankRhFormInput } from "../queries/RhFormMutation";
import { exactSubsetOrDefault, assertNotNull } from "../util/util";
import { NextButton, BackButton } from "../ui/buttons";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { AppContext, AppContextType } from "../app-context";
import { Link, Route } from "react-router-dom";
import { RhFormInput } from "../queries/globalTypes";
import { RhSendEmailMutation } from "../queries/RhSendEmailMutation";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import {
  ConfirmAddressModal,
  redirectToAddressConfirmationOrNextStep,
} from "../ui/address-confirmation";
import { ClearSessionButton } from "../forms/clear-session-button";
import { OutboundLink } from "../analytics/google-analytics";
import { CustomerSupportLink } from "../ui/customer-support-link";
import { updateAddressFromBrowserStorage } from "../browser-storage";
import { GetStartedButton } from "../ui/get-started-button";
import { ProgressiveLoadableConfetti } from "../ui/confetti-loadable";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { RhEmailToDhcr } from "./email-to-dhcr";

const RH_ICON = "frontend/img/ddo/rent.svg";

function RentalHistorySplash(): JSX.Element {
  return (
    <Page title="Request your Rent History">
      <section className="hero is-light">
        <div className="hero-body">
          <div className="has-text-centered">
            <div className="is-inline-block jf-rh-icon">
              <StaticImage ratio="is-square" src={RH_ICON} alt="" />
            </div>
            <h1 className="title is-spaced">
              Request your <span className="is-italic">Rent History</span> in
              two simple steps!
            </h1>
            <p className="subtitle">
              This document helps you find out if your apartment is{" "}
              <b>rent stabilized</b> and if you're being <b>overcharged</b>. It
              shows the registered rents in your apartment since 1984.
            </p>
            <p className="subtitle is-italic">
              This service is free, secure, and confidential.
            </p>
            <GetStartedButton
              to={JustfixRoutes.locale.rh.form}
              intent="RH"
              pageType="splash"
            >
              Start my request
            </GetStartedButton>
          </div>
        </div>
      </section>
    </Page>
  );
}

/** This function renders a confirmation modal for when a user's inputted address isn't verified by our geocoder. */

function FormConfirmAddressModal(props: { toStep2: string }): JSX.Element {
  const addrInfo =
    useContext(AppContext).session.rentalHistoryInfo || BlankRhFormInput;
  return <ConfirmAddressModal nextStep={props.toStep2} {...addrInfo} />;
}

/**
 * This function generates a RhFormInput object based on any data that a logged-in user may have already inputted.
 * If there is no pre-existing user data, we return a blank RhFormInput object.
 */

export function GenerateUserRhFormInput(
  appContext: AppContextType
): RhFormInput {
  const userData = appContext.session;

  if (!userData || !userData.userId) {
    return BlankRhFormInput;
  }

  const UserRhFormInput: RhFormInput = {
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    address: (userData.onboardingInfo && userData.onboardingInfo.address) || "",
    borough: (userData.onboardingInfo && userData.onboardingInfo.borough) || "",
    apartmentNumber:
      (userData.onboardingInfo && userData.onboardingInfo.aptNumber) || "",
    phoneNumber: userData.phoneNumber || "",
  };

  return UserRhFormInput;
}

function RentalHistoryForm(): JSX.Element {
  const UserRhFormInput = GenerateUserRhFormInput(useContext(AppContext));

  const cancelControlRef = useRef(null);

  return (
    <Page title="Request the Rent History for your apartment">
      <h1 className="title is-4">
        Request the Rent History for your apartment
      </h1>
      <SessionUpdatingFormSubmitter
        mutation={RhFormMutation}
        initialState={(s) =>
          exactSubsetOrDefault(s.rentalHistoryInfo, UserRhFormInput)
        }
        updateInitialStateInBrowser={updateAddressFromBrowserStorage}
        onSuccessRedirect={(output, input) =>
          redirectToAddressConfirmationOrNextStep({
            input,
            resolved: assertNotNull(
              assertNotNull(output.session).rentalHistoryInfo
            ),
            nextStep: JustfixRoutes.locale.rh.preview,
            confirmation: JustfixRoutes.locale.rh.formAddressModal,
          })
        }
      >
        {(ctx) => (
          <>
            <div className="columns is-mobile">
              <div className="column">
                <TextualFormField
                  label="First name"
                  {...ctx.fieldPropsFor("firstName")}
                />
              </div>
              <div className="column">
                <TextualFormField
                  label="Last name"
                  {...ctx.fieldPropsFor("lastName")}
                />
              </div>
            </div>
            <AddressAndBoroughField
              addressProps={ctx.fieldPropsFor("address")}
              boroughProps={ctx.fieldPropsFor("borough")}
            />
            <TextualFormField
              label="Apartment number"
              autoComplete="address-line2 street-address"
              {...ctx.fieldPropsFor("apartmentNumber")}
            />
            <PhoneNumberFormField
              label="Phone number"
              {...ctx.fieldPropsFor("phoneNumber")}
            />
            <div className="field is-grouped jf-two-buttons">
              <div className="control" ref={cancelControlRef} />
              <NextButton isLoading={ctx.isLoading} />
            </div>
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <ClearSessionButton
        to={JustfixRoutes.locale.rh.splash}
        portalRef={cancelControlRef}
        label="Cancel request"
      />
      <Route
        path={JustfixRoutes.locale.rh.formAddressModal}
        exact
        render={() => (
          <FormConfirmAddressModal toStep2={JustfixRoutes.locale.rh.preview} />
        )}
      />
    </Page>
  );
}

function RentalHistoryPreview(): JSX.Element {
  return (
    <Page title="Review your email to the DHCR">
      <h1 className="title is-4">Review your request to the DHCR</h1>
      <p>
        Here is a preview of the request for your Rent History. It includes your
        address and apartment number so that the DHCR can mail you.
      </p>
      <br />
      <article className="message">
        <div className="message-header has-text-weight-normal">
          To: New York Division of Housing and Community Renewal (DHCR)
        </div>
        <div className="message-body has-background-grey-lighter has-text-left content">
          <RhEmailToDhcr />
        </div>
      </article>
      <DemoDeploymentNote>
        <p>
          This demo site <strong>will not send</strong> a real request to the
          DHCR.
        </p>
      </DemoDeploymentNote>
      <div className="field is-grouped jf-two-buttons">
        <BackButton label="Back" to={JustfixRoutes.locale.rh.form} />
        <SessionUpdatingFormSubmitter
          mutation={RhSendEmailMutation}
          initialState={{}}
          onSuccessRedirect={JustfixRoutes.locale.rh.confirmation}
        >
          {(ctx) => (
            <NextButton label="Submit request" isLoading={ctx.isLoading} />
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
}

function RentalHistoryConfirmation(): JSX.Element {
  const appContext = useContext(AppContext);
  const { onboardingInfo } = appContext.session;
  return (
    <Page
      title="Your Rent History has been requested!"
      withHeading="big"
      className="content"
    >
      <ProgressiveLoadableConfetti regenerateForSecs={1} />
      <h2>What happens next?</h2>
      <p>
        You should receive your Rent History in the mail in about a week. Your
        Rent History is an important document— it shows the registered rents in
        your apartment since 1984. You can learn more about it and how it can
        help you figure out if you’re being overcharged on rent:{" "}
        <OutboundLink
          href="https://www.metcouncilonhousing.org/knowledgebase/rent-stabilization-overcharges"
          target="_blank"
        >
          https://www.metcouncilonhousing.org/knowledgebase/rent-stabilization-overcharges
        </OutboundLink>
        .
      </p>
      <p>
        If you have more questions, please email us at <CustomerSupportLink />.
      </p>
      <Link
        to={JustfixRoutes.locale.homeWithSearch(onboardingInfo)}
        className="button is-primary is-medium"
      >
        Explore our other tools
      </Link>
      <h2>Want to read more about your rights?</h2>
      <ul>
        <li>
          <OutboundLink
            href="https://www.metcouncilonhousing.org/help-answers/"
            target="_blank"
          >
            Met Council on Housing
          </OutboundLink>
        </li>
        <li>
          <OutboundLink
            href="http://housingcourtanswers.org/glossary/"
            target="_blank"
          >
            Housing Court Answers
          </OutboundLink>
        </li>
        <li>
          <OutboundLink
            href="https://www.justfix.nyc/learn?utm_source=tenantplatform&utm_medium=rh"
            target="_blank"
          >
            JustFix.nyc's Learning Center
          </OutboundLink>
        </li>
      </ul>
    </Page>
  );
}

export const getRentalHistoryRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: JustfixRoutes.locale.rh.latestStep,
  label: "Rent History",
  welcomeSteps: [
    {
      path: JustfixRoutes.locale.rh.splash,
      exact: true,
      component: RentalHistorySplash,
    },
  ],
  stepsToFillOut: [
    {
      path: JustfixRoutes.locale.rh.form,
      exact: true,
      component: RentalHistoryForm,
    },
    {
      path: JustfixRoutes.locale.rh.preview,
      exact: true,
      component: RentalHistoryPreview,
    },
  ],
  confirmationSteps: [
    {
      path: JustfixRoutes.locale.rh.confirmation,
      exact: true,
      component: RentalHistoryConfirmation,
    },
    {
      path: JustfixRoutes.locale.rh.formAddressModal,
      exact: true,
      component: RentalHistoryForm,
    },
  ],
});

const RentalHistoryRoutes = buildProgressRoutesComponent(
  getRentalHistoryRoutesProps
);

export default RentalHistoryRoutes;
