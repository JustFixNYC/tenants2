import React from 'react';

import { ProgressRoutesProps, buildProgressRoutesComponent } from "./progress-routes";
import Routes from "./routes";
import Page from "./page";
import { StaticImage } from './static-image';
import { Form } from './form';
import { FormContext } from './form-context';
import { TextualFormField } from './form-fields';
import { Route } from 'react-router';
import { PrivacyInfoModal } from './pages/onboarding-step-1';
import { Link } from 'react-router-dom';

const RH_ICON = "frontend/img/ddo/rent.svg";

/* Rental history welcome page */

function RentalHistoryWelcome(): JSX.Element {
    return (
      <Page title="Request your rental history through our online form" withHeading="big" className="content">
        <div className="content">
          <StaticImage src={RH_ICON} alt="rent-icon" ratio="is-128x128" />
        </div>
        <p>Let's help you request your <b>rental history</b>! This document, kept by the NY Division of Housing & Community Renewal (DHCR), helps you find out if you're being overcharged.</p>
        <p><em>This service is free, secure, and confidential.</em></p>
      </Page>
    );
  }

/* Rental history form page */

type RhFormInput = {
  firstName: string,
  lastName: string,
  address: string,
  apartmentNumber: string
};

const rhFormInitialState: RhFormInput = { 
  firstName: '',
  lastName: '',
  address: '',
  apartmentNumber: ''
};

const renderRhFormFields = (ctx: FormContext<RhFormInput>) => <>
  <div className= "columns is-mobile">
    <div className="column">
      <TextualFormField label="First name" {...ctx.fieldPropsFor('firstName')} />
    </div>
    <div className="column">
      <TextualFormField label="Last name" {...ctx.fieldPropsFor('lastName')} />
    </div>
  </div>

  {/* To replace with <AddressAndBoroughField /> */}
  <TextualFormField label="Address" {...ctx.fieldPropsFor('address')} /> 
  <TextualFormField label="Apartment number" {...ctx.fieldPropsFor('apartmentNumber')} />
  <Route path="/address-modal" exact component={PrivacyInfoModal} />
  <p>
    Your privacy is very important to us! Everything on JustFix.nyc is kept confidential and secure. {" "}
    <Link to="/address-modal">Click here to learn more<span className="jf-sr-only"> about our privacy policy</span></Link>.
  </p>
</>;

const mockSubmit = () => console.log("boop!");


function RentalHistoryForm(): JSX.Element {
  
  return (
    <Page title="Request the rental history for your apartment">
      <h1 className="title is-4">Request the rental history for your apartment</h1>
      <Form onSubmit={mockSubmit} isLoading={false} initialState={rhFormInitialState}>
        {renderRhFormFields}
      </Form>
    </Page>
  );
}

function RentalHistoryPreview(): JSX.Element {
  return (
    <Page title="Review your email to the DHCR">
      <h1 className="title is-4">Review your email to the DHCR</h1>
      <p>Here is a preview of your email to request your rental history. It includes your address and apartment number so that the DHCR can mail you.</p>
        <br />
      <article className="message">
        <div className="message-header">
          <p className="has-text-weight-normal">To: New York DHCR &#60;rentinfo@nyshcr.org&#62;</p>
        </div>
        <div className="message-body">
          <h4 className="is-italic">Subject: Requesting my Rental History</h4>
            <div className="is-divider jf-divider-narrow" />
          <p>DHCR administrator,</p>
            <br />
          <p>I, @contact.name, am currently living at @extra.features.0.properties.label in apartment @flow.contact_apt.text and would like to request the complete rent history for this apartment back to the year 1984.</p>
            <br />
          <p>Thank you,</p>
            <br />
          <p>- YOUR NAME HERE</p>
        </div>
      </article>
    </Page>
  );
}

function RentalHistoryConfirmation(): JSX.Element {
  return (
    <Page title="Your rental history has been requested!" withHeading="big" className="content">
      <h1 className="title is-4">What happens next?</h1>
      <p>You should receive your rental history in the mail in about a week. If you have more questions, please email us at <a href="mailto:support@justfix.nyc" target="_blank" rel="noopener noreferrer">support@justfix.nyc</a>.</p>
      <h1 className="title is-4">Want to read more about your rights?</h1>
      <ul>
        <li><a href="http://metcouncilonhousing.org/help_and_answers" target="_blank">MetCouncil on Housing</a></li>
        <li><a href="http://housingcourtanswers.org/glossary/" target="_blank">Housing Court Answers</a></li>
      </ul>
    </Page>
  );
}


export const getRentalHistoryRoutesProps = (): ProgressRoutesProps => ({
    toLatestStep: Routes.locale.rh.latestStep,
    label: "Rental History",
    welcomeSteps: [{
      path: Routes.locale.rh.splash, exact: true, component: RentalHistoryWelcome
    }],
    stepsToFillOut: [
      { path: Routes.locale.rh.form, exact: true, component: RentalHistoryForm},
      { path: Routes.locale.rh.preview, exact: true, component: RentalHistoryPreview},
    ],
    confirmationSteps: [
      { path: Routes.locale.rh.confirmation, exact: true, component: RentalHistoryConfirmation
    }]
  });

  const RentalHistoryRoutes = buildProgressRoutesComponent(getRentalHistoryRoutesProps);

  export default RentalHistoryRoutes;