import React from "react";
import {
  LandlordEmail,
  shouldSkipLandlordEmailStep,
} from "../../../common-steps/landlord-email";
import LandlordMailingAddress, {
  shouldSkipLandlordMailingAddressStep,
} from "../../../common-steps/landlord-mailing-address";
import { LandlordNameAndContactTypes } from "../../../common-steps/landlord-name-and-contact-types";
import { ProgressRoutesProps } from "../../../progress/progress-routes";
import { MiddleProgressStep } from "../../../progress/progress-step-route";
import { buildProgressRoutesComponent } from "../../../progress/progress-routes";
import { LaLetterBuilderRoutes } from "../../route-info";
import { LaLetterBuilderConfirmation } from "./confirmation";

const LaLetterBuilderLandlordNameAndContactTypes = MiddleProgressStep(
  (props) => (
    <LandlordNameAndContactTypes {...props}>
      <p>TODO: Add content here.</p>
    </LandlordNameAndContactTypes>
  )
);

const LaLetterBuilderLandlordEmail = MiddleProgressStep((props) => (
  <LandlordEmail {...props} introText="TODO: Add content here." />
));

const LaLetterBuilderLandlordMailingAddress = MiddleProgressStep((props) => (
  <LandlordMailingAddress
    {...props}
    confirmModalRoute={
      LaLetterBuilderRoutes.locale.letter.habitability
        .landlordAddressConfirmModal
    }
  >
    <p>TODO: Add content here.</p>
  </LandlordMailingAddress>
));

export const getHabitabilityProgressRoutesProps = (): ProgressRoutesProps => {
  const routes = LaLetterBuilderRoutes.locale.letter.habitability;
  console.log(routes.landlordName);

  return {
    toLatestStep: routes.latestStep,
    welcomeSteps: [
      {
        path: routes.landlordName,
        exact: true,
        component: LaLetterBuilderLandlordNameAndContactTypes,
      },
    ],
    stepsToFillOut: [
      {
        path: routes.landlordEmail,
        exact: true,
        shouldBeSkipped: shouldSkipLandlordEmailStep,
        component: LaLetterBuilderLandlordEmail,
      },
      {
        path: routes.landlordAddress,
        exact: false,
        shouldBeSkipped: shouldSkipLandlordMailingAddressStep,
        component: LaLetterBuilderLandlordMailingAddress,
      },
    ],
    confirmationSteps: [
      {
        path: routes.confirmation,
        exact: true,
        component: LaLetterBuilderConfirmation,
      },
    ],
  };
};

export const HabitabilityRoutes = buildProgressRoutesComponent(
  getHabitabilityProgressRoutesProps
);
