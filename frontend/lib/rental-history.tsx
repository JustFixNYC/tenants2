import React, { useContext, useRef } from 'react';

import { ProgressRoutesProps, buildProgressRoutesComponent } from "./progress-routes";
import Routes from "./routes";
import Page from "./page";
import { StaticImage } from './static-image';
import { TextualFormField } from './form-fields';
import { SessionUpdatingFormSubmitter } from './session-updating-form-submitter';
import { RhFormMutation, BlankRhFormInput } from './queries/RhFormMutation';
import { exactSubsetOrDefault, assertNotNull } from './util';
import { NextButton, BackButton, CenteredPrimaryButtonLink } from './buttons';
import { PhoneNumberFormField } from './phone-number-form-field';
import { AppContext, AppContextType} from './app-context';
import { Link, Route } from 'react-router-dom';
import { RhFormInput } from './queries/globalTypes';
import { RhSendEmailMutation } from './queries/RhSendEmailMutation';
import * as rhEmailText from '../../common-data/rh.json';
import { AddressAndBoroughField } from './address-and-borough-form-field';
import { ConfirmAddressModal, redirectToAddressConfirmationOrNextStep } from './address-confirmation';
import { getBoroughChoiceLabels, BoroughChoice } from '../../common-data/borough-choices';
import { ClearSessionButton } from './clear-session-button';
import { OutboundLink } from './google-analytics';
import { CustomerSupportLink } from './customer-support-link';

const RH_ICON = "frontend/img/ddo/rent.svg";

/* Rent history welcome page */

function RentalHistoryWelcome(): JSX.Element {
    return (
      <Page title="Request your rent history">
         <section className="hero is-light">
          <div className="hero-body">
            <div className="has-text-centered">
              <div className="is-inline-block jf-rh-icon">
                <StaticImage ratio="is-square" src={RH_ICON} alt="" />
              </div>
              <h1 className="title is-spaced">
                Request your rent history in two simple steps!
              </h1>
              <p className="subtitle">
                Let's help you request your <b>rent history</b>! This document, kept by the NY Division of Housing &amp; Community Renewal (DHCR), helps you find out if you're being overcharged.
              </p>
              <p className="subtitle is-italic">
                This service is free, secure, and confidential.
              </p>
              <CenteredPrimaryButtonLink to={Routes.locale.rh.form} className="is-large">
                Start my request
              </CenteredPrimaryButtonLink>
            </div>
          </div>
        </section>
      </Page>
    );
  }

function FormConfirmAddressModal(props: { toStep2: string }): JSX.Element {
  const addrInfo = useContext(AppContext).session.rentalHistoryInfo || BlankRhFormInput;
  return <ConfirmAddressModal nextStep={props.toStep2} {...addrInfo} />
}

function GenerateUserRhFormInput(appContext: AppContextType): RhFormInput {
  const userData = appContext.session;
  const UserRhFormInput: RhFormInput = (userData && userData.userId ?
    {
      "firstName": ( userData.firstName || "" ),
      "lastName": ( userData.lastName || "" ),
      "address": ( (userData.onboardingInfo && userData.onboardingInfo.address) || "" ),
      "borough": ( (userData.onboardingInfo && userData.onboardingInfo.borough) || "" ),
      "apartmentNumber": (userData.onboardingInfo && userData.onboardingInfo.aptNumber || "") ,
      "phoneNumber": (userData.phoneNumber || "")
    } :
    BlankRhFormInput);

  return UserRhFormInput;
}

function RentalHistoryForm(): JSX.Element {

    const UserRhFormInput = GenerateUserRhFormInput(useContext(AppContext));

    const cancelControlRef = useRef(null);
  
  return (
    <Page title="Request the rent history for your apartment">
      <h1 className="title is-4">Request the rent history for your apartment</h1>
      <SessionUpdatingFormSubmitter
        mutation={RhFormMutation}
        initialState={s => exactSubsetOrDefault(s.rentalHistoryInfo, UserRhFormInput)}
        onSuccessRedirect={(output, input) => redirectToAddressConfirmationOrNextStep({
          input,
          resolved: assertNotNull(assertNotNull(output.session).rentalHistoryInfo),
          nextStep: Routes.locale.rh.preview,
          confirmation: Routes.locale.rh.formAddressModal
        })}
      >{(ctx) => 
        <>
          <div className="columns is-mobile">
            <div className="column">
              <TextualFormField label="First name" {...ctx.fieldPropsFor('firstName')} />
            </div>
            <div className="column">
              <TextualFormField label="Last name" {...ctx.fieldPropsFor('lastName')} />
            </div>
          </div>
            <AddressAndBoroughField
              addressProps={ctx.fieldPropsFor('address')}
              boroughProps={ctx.fieldPropsFor('borough')}
            />
          <TextualFormField label="Apartment number" autoComplete="address-line2 street-address" {...ctx.fieldPropsFor('apartmentNumber')} />
          <PhoneNumberFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
          <div className="field is-grouped jf-two-buttons">
          <div className="control" ref={cancelControlRef} />
            <NextButton isLoading={ctx.isLoading} />
          </div> 
        </>
      }
      </SessionUpdatingFormSubmitter>
      <ClearSessionButton
          to={Routes.locale.rh.splash}
          portalRef={cancelControlRef}
          label="Cancel request"
        />
      <Route path={Routes.locale.rh.formAddressModal} exact render={() => (
        <FormConfirmAddressModal toStep2={Routes.locale.rh.preview} />
      )} />
    </Page>
  );
}

function RentalHistoryPreview(): JSX.Element {
  const appContext = useContext(AppContext);
  const formData = appContext.session.rentalHistoryInfo;

  return (
    <Page title="Review your email to the DHCR">
      <h1 className="title is-4">Review your request to the DHCR</h1>
      <p>Here is a preview of the request for your rent history. It includes your address and apartment number so that the DHCR can mail you.</p>
        <br />
      {formData &&
        <article className="message">
          <div className="message-header">
            <p className="has-text-weight-normal">To: New York Division of Housing and Community Renewal (DHCR)</p>
          </div>
          <div className="message-body">
            <h4 className="is-italic">Subject: {rhEmailText.DHCR_EMAIL_SUBJECT}</h4>
              <div className="is-divider jf-divider-narrow" />
            <p>DHCR administrator,</p>
              <br />
            <p>
              {rhEmailText.DHCR_EMAIL_BODY
                .replace('FULL_NAME', formData.firstName + ' ' + formData.lastName)
                .replace('FULL_ADDRESS', formData.address + ', ' + getBoroughChoiceLabels()[formData.borough as BoroughChoice])
                .replace('APARTMENT_NUMBER', formData.apartmentNumber)}
            </p>
              <br />
            <p>{rhEmailText.DHCR_EMAIL_SIGNATURE} </p>
            <p>{formData.firstName + ' ' + formData.lastName}</p>
          </div>
        </article>
      }
      <div className="field is-grouped jf-two-buttons">
        <BackButton label="Back" to={Routes.locale.rh.form} />
        <SessionUpdatingFormSubmitter
          mutation={RhSendEmailMutation}
          initialState={{}}
          onSuccessRedirect={Routes.locale.rh.confirmation}
        >
          {(ctx) => 
          <NextButton label="Submit request" isLoading={ctx.isLoading} /> }
        </SessionUpdatingFormSubmitter>
      </div> 
    </Page>
  );
}

function RentalHistoryConfirmation(): JSX.Element {
  return (
    <Page title="Your rent history has been requested!" withHeading="big" className="content">
      <h2>What happens next?</h2>
      <p>You should receive your rent history in the mail in about a week. If you have more questions, please email us at <CustomerSupportLink />.</p>
      <Link to={Routes.locale.dataDrivenOnboarding} className="button is-primary is-medium">Explore our other tools</Link>
      <h2>Want to read more about your rights?</h2>
      <ul>
      <li><OutboundLink href="http://metcouncilonhousing.org/campaigns_pages/rent_history_0" target="_blank">Met Council on Housing</OutboundLink>
          {' '}(<OutboundLink href="http://metcouncilonhousing.org/Rent_History_Spanish" target="_blank">en español</OutboundLink>)</li>
        <li><OutboundLink href="http://housingcourtanswers.org/glossary/" target="_blank">Housing Court Answers</OutboundLink></li>
      </ul>
    </Page>
  );
}

export const getRentalHistoryRoutesProps = (): ProgressRoutesProps => ({
    toLatestStep: Routes.locale.rh.latestStep,
    label: "Rent History",
    welcomeSteps: [{
      path: Routes.locale.rh.splash, exact: true, component: RentalHistoryWelcome
    }],
    stepsToFillOut: [
      { path: Routes.locale.rh.form, exact: true, component: RentalHistoryForm},
      { path: Routes.locale.rh.preview, exact: true, component: RentalHistoryPreview},
    ],
    confirmationSteps: [
      { path: Routes.locale.rh.confirmation, exact: true, component: RentalHistoryConfirmation},
      { path: Routes.locale.rh.formAddressModal, exact: true, component: RentalHistoryForm
    }]
  });

  const RentalHistoryRoutes = buildProgressRoutesComponent(getRentalHistoryRoutesProps);

  export default RentalHistoryRoutes;