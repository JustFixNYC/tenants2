import { t, Trans } from "@lingui/macro";
import React from "react";
import { li18n } from "../../i18n-lingui";
import { ProgressButtonsAsLinks } from "../../ui/buttons";
import { OutboundLink } from "../../ui/outbound-link";
import Page from "../../ui/page";
import { LaLetterBuilderOnboardingStep } from "../letter-builder/step-decorators";
import ResponsiveElement from "./responsive-element";

export const LaLetterBuilderReviewRights = LaLetterBuilderOnboardingStep(
  (props) => {
    return (
      <Page title={li18n._(t`Review your rights as a tenant`)}>
        <ResponsiveElement className="mb-8" desktop="h3" touch="h1">
          <Trans>Review your rights as a tenant</Trans>
        </ResponsiveElement>
        <ResponsiveElement className="mb-7" desktop="h4" touch="h3">
          <Trans id="laletterbuilder.reviewTenantRightsIntro">
            Tenants have a right to a safe home, without harassment. Sending a
            letter to notify your landlord is within your rights.
          </Trans>
        </ResponsiveElement>
        <div className="content">
          <Trans id="laletterbuilder.retaliationInfo">
            <p>
              If your landlord is retaliating against you for exercising your
              rights, you can:
            </p>
            <ul>
              <li>
                <p>
                  Attend SAJE'S{" "}
                  <OutboundLink href="https://www.saje.net/what-we-do/tenant-action-clinic/">
                    Tenant Action Clinic
                  </OutboundLink>
                </p>
              </li>
              <li>
                <p>
                  File a complaint with{" "}
                  <OutboundLink href="https://housing.lacity.org/residents/file-a-complaint">
                    Los Angeles Housing Department (LAHD)
                  </OutboundLink>
                  if you live in the City of LA or{" "}
                  <OutboundLink href="http://publichealth.lacounty.gov/eh/about/contact-us.htm#customer-call-center">
                    Public Health
                  </OutboundLink>{" "}
                  if you live someplace else in LA County
                </p>
              </li>
            </ul>
          </Trans>
        </div>
        <ProgressButtonsAsLinks back={props.prevStep} next={props.nextStep} />{" "}
      </Page>
    );
  }
);
