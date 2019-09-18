import React from 'react';

import { ProgressRoutesProps, buildProgressRoutesComponent } from "./progress-routes";
import Routes from "./routes";
import Page from "./page";


function RentalHistoryDummy(): JSX.Element {
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
      path: Routes.locale.rh.splash, exact: true, component: RentalHistoryDummy
    }],
    stepsToFillOut: [
      { path: Routes.locale.rh.form, exact: true, component: RentalHistoryDummy},
      { path: Routes.locale.rh.preview, exact: true, component: RentalHistoryDummy},
    ],
    confirmationSteps: [
      { path: Routes.locale.rh.confirmation, exact: true, component: RentalHistoryDummy
    }]
  });

  const RentalHistoryRoutes = buildProgressRoutesComponent(getRentalHistoryRoutesProps);

  export default RentalHistoryRoutes;