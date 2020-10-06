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
import { Link, Route, Switch } from "react-router-dom";
import { RhFormInput } from "../queries/globalTypes";
import { RhSendEmailMutation } from "../queries/RhSendEmailMutation";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import {
  ConfirmAddressModal,
  redirectToAddressConfirmationOrNextStep,
} from "../ui/address-confirmation";
import { ClearSessionButton } from "../forms/clear-session-button";
import { CustomerSupportLink } from "../ui/customer-support-link";
import { updateAddressFromBrowserStorage } from "../browser-storage";
import { GetStartedButton } from "../ui/get-started-button";
import { ProgressiveLoadableConfetti } from "../ui/confetti-loadable";
import { DemoDeploymentNote } from "../ui/demo-deployment-note";
import { RhEmailToDhcr, RhEmailToDhcrStaticPage } from "./email-to-dhcr";
import { renderSuccessHeading } from "../ui/success-heading";
import { li18n, createLinguiCatalogLoader } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import loadable from "@loadable/component";
import {
  EnglishOutboundLink,
  LocalizedOutboundLinkProps,
  LocalizedOutboundLinkList,
} from "../ui/localized-outbound-link";

const RH_ICON = "frontend/img/ddo/rent.svg";

export const RhLinguiI18n = createLinguiCatalogLoader({
  en: loadable.lib(() => import("../../../locales/en/rh.chunk") as any),
  es: loadable.lib(() => import("../../../locales/es/rh.chunk") as any),
});

function RentalHistorySplash(): JSX.Element {
  return (
    <Page title={li18n._(t`Request your Rent History`)}>
      <section className="hero is-light">
        <div className="hero-body">
          <div className="has-text-centered">
            <div className="is-inline-block jf-rh-icon">
              <StaticImage ratio="is-square" src={RH_ICON} alt="" />
            </div>
            <h1 className="title is-spaced">
              <Trans>
                Request your <span className="is-italic">Rent History</span>{" "}
                from the NY State DHCR* in two simple steps!
              </Trans>
            </h1>
            <p className="subtitle">
              <Trans id="justfix.rhExplanation">
                This document helps you find out if your apartment is{" "}
                <b>rent stabilized</b> and if you're being <b>overcharged</b>.
                It shows the registered rents in your apartment since 1984.
              </Trans>
            </p>
            <p className="subtitle is-italic">
              <Trans>This service is free, secure, and confidential.</Trans>
            </p>
            <GetStartedButton
              to={JustfixRoutes.locale.rh.form}
              intent="RH"
              pageType="splash"
            >
              <Trans>Start my request</Trans>
            </GetStartedButton>
            <br />
            <div className="jf-secondary-cta">
              <div className="content has-text-centered is-size-7">
                *Division of Housing and Community Renewal
              </div>
            </div>
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
    <Page
      title={li18n._(t`Request your apartment's Rent History from the DHCR`)}
      withHeading
    >
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
                  label={li18n._(t`First name`)}
                  {...ctx.fieldPropsFor("firstName")}
                />
              </div>
              <div className="column">
                <TextualFormField
                  label={li18n._(t`Last name`)}
                  {...ctx.fieldPropsFor("lastName")}
                />
              </div>
            </div>
            <AddressAndBoroughField
              addressProps={ctx.fieldPropsFor("address")}
              boroughProps={ctx.fieldPropsFor("borough")}
            />
            <TextualFormField
              label={li18n._(t`Apartment number`)}
              autoComplete="address-line2 street-address"
              {...ctx.fieldPropsFor("apartmentNumber")}
            />
            <PhoneNumberFormField
              label={li18n._(t`Phone number`)}
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
        label={li18n._(t`Cancel request`)}
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
    <Page title={li18n._(t`Review your request to the DHCR`)} withHeading>
      <p>
        <Trans>
          Here is a preview of the request for your Rent History. It includes
          your address and apartment number so that the DHCR can mail you.
        </Trans>
      </p>
      <br />
      <article className="message">
        <div className="message-header has-text-weight-normal">
          <Trans>
            To: New York Division of Housing and Community Renewal (DHCR)
          </Trans>
        </div>
        <div className="message-body content">
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
        <BackButton to={JustfixRoutes.locale.rh.form} />
        <SessionUpdatingFormSubmitter
          mutation={RhSendEmailMutation}
          initialState={{}}
          onSuccessRedirect={JustfixRoutes.locale.rh.confirmation}
        >
          {(ctx) => (
            <NextButton
              label={li18n._(t`Submit request`)}
              isLoading={ctx.isLoading}
            />
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
}

const KYR_LINKS: LocalizedOutboundLinkProps[] = [
  {
    children: <Trans>Met Council on Housing</Trans>,
    hrefs: {
      en: "https://www.metcouncilonhousing.org/help-answers/",
    },
  },
  {
    children: <Trans>Housing Court Answers</Trans>,
    hrefs: {
      en: "http://housingcourtanswers.org/glossary/",
    },
  },
  {
    children: <Trans>JustFix.nyc's Learning Center</Trans>,
    hrefs: {
      en:
        "https://www.justfix.nyc/learn?utm_source=tenantplatform&utm_medium=rh",
    },
  },
];

function RentalHistoryConfirmation(): JSX.Element {
  const appContext = useContext(AppContext);
  const { onboardingInfo } = appContext.session;
  return (
    <Page
      title={li18n._(
        t`Your Rent History has been requested from the New York State DHCR!`
      )}
      withHeading={renderSuccessHeading}
      className="content"
    >
      <ProgressiveLoadableConfetti regenerateForSecs={1} />
      <h2>
        <Trans>What happens next?</Trans>
      </h2>
      <p>
        <Trans id="justfix.rhWhatHappensNext">
          You should receive your Rent History in the mail in about a week. Your
          Rent History is an important document—it shows the registered rents in
          your apartment since 1984. You can learn more about it and how it can
          help you figure out if you’re being overcharged on rent at the{" "}
          <EnglishOutboundLink href="https://www.metcouncilonhousing.org/help-answers/rent-stabilization-overcharges/">
            Met Council on Housing guide to Rent Stabilization Overcharges
          </EnglishOutboundLink>
          .
        </Trans>
      </p>
      <p>
        <Trans>
          If you have more questions, please email us at <CustomerSupportLink />
          .
        </Trans>
      </p>
      <Link
        to={JustfixRoutes.locale.homeWithSearch(onboardingInfo)}
        className="button is-primary is-medium"
      >
        <Trans>Explore our other tools</Trans>
      </Link>
      <h2>
        <Trans>Want to read more about your rights?</Trans>
      </h2>
      <LocalizedOutboundLinkList links={KYR_LINKS} />
    </Page>
  );
}

export const getRentalHistoryRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: JustfixRoutes.locale.rh.latestStep,
  label: li18n._(t`Rent History`),
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

const RentalHistoryProgressRoutes = buildProgressRoutesComponent(
  getRentalHistoryRoutesProps
);

const RentalHistoryRoutes: React.FC<{}> = () => (
  <RhLinguiI18n>
    <Switch>
      <Route
        path={JustfixRoutes.locale.rh.emailToDhcr}
        exact
        component={RhEmailToDhcrStaticPage}
      />
      <Route component={RentalHistoryProgressRoutes} />
    </Switch>
  </RhLinguiI18n>
);

export default RentalHistoryRoutes;
