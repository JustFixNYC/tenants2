import React from 'react';

import { ProgressRoutesProps, buildProgressRoutesComponent } from "./progress-routes";
import Routes from "./routes";
import Page from "./page";
import { StaticImage } from './static-image';

const RH_ICON = "frontend/img/ddo/rent.svg";

function RentalHistoryWelcome(): JSX.Element {
    return (
      <Page title="Request your rental history through our online form" withHeading="big" className="content">
        <div className="content">
          <StaticImage src={RH_ICON} alt="rent-icon" ratio="is-128x128" />
        </div>
        <p>Let's help you request your <b>rental history</b> from DHCR! This document helps you find out if you're being overcharged.</p>
        <p><em>This service is free, secure, and confidential.</em></p>
      </Page>
    );
  }

  function RentalHistoryForm(): JSX.Element {
    return (
      <Page title="Sue your landlord for Repairs and/or Harassment through an HP Action proceeding" withHeading="big" className="content">
        <p>Hello BOOP!</p>
        <p>An <strong>HP Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you.</p>
        <p><em>This service is free, secure, and confidential.</em></p>
      </Page>
    );
  }

  function RentalHistoryPreview(): JSX.Element {
    return (
      <Page title="Sue your landlord for Repairs and/or Harassment through an HP Action proceeding" withHeading="big" className="content">
        <p>Hello BOOP!</p>
        <p>An <strong>HP Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you.</p>
        <p><em>This service is free, secure, and confidential.</em></p>
      </Page>
    );
  }

  function RentalHistoryConfirmation(): JSX.Element {
    return (
      <Page title="Sue your landlord for Repairs and/or Harassment through an HP Action proceeding" withHeading="big" className="content">
        <p>Hello BOOP!</p>
        <p>An <strong>HP Action</strong> is a legal case you can bring against your landlord for failing to make repairs, not providing essential services, or harassing you.</p>
        <p><em>This service is free, secure, and confidential.</em></p>
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