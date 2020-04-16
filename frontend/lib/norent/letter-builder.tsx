import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress/progress-routes";
import { NorentRoutes } from "./routes";
import { NorentTenantInfoPage } from "./tenant-info-page";
import { NorentLandlordInfoPage } from "./landlord-info-page";
import { NorentLetterPreviewPage } from "./letter-preview";

export const getNoRentLetterProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: NorentRoutes.locale.letter.latestStep,
  label: "Build your letter",
  welcomeSteps: [],
  stepsToFillOut: [
    {
      path: NorentRoutes.locale.letter.tenantInfo,
      exact: true,
      component: NorentTenantInfoPage,
    },
    {
      path: NorentRoutes.locale.letter.landlordInfo,
      exact: true,
      component: NorentLandlordInfoPage,
    },
    {
      path: NorentRoutes.locale.letter.preview,
      exact: true,
      component: NorentLetterPreviewPage,
    },
  ],
  confirmationSteps: [],
});

export const NorentLetterRoutes = buildProgressRoutesComponent(
  getNoRentLetterProgressRoutesProps
);
