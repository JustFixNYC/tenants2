import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import {
  evictionFreeDeclarationEmailFormalSubject,
  EvictionFreeDeclarationEmailProps,
  sessionToEvictionFreeDeclarationEmailProps,
} from "./declaration-email-utils";

export const EvictionFreeEmailDisclaimer: React.FC<{
  fullLegalName: string;
}> = ({ fullLegalName }) => (
  <small>
    Note: {fullLegalName} is submitting the attached Hardship Declaration to the
    Court using this JustFix.nyc email address. This email address is used
    solely for the purpose of submitting the Hardship Declaration and receiving
    confirmation of its receipt. This email address is not the Declarant's own
    email address and should not be used to communicate with the Declarant for
    any purpose apart from supplying confirmation of receipt of the attached
    Hardship Declaration.
  </small>
);

function emailSubject(options: EvictionFreeDeclarationEmailProps): string {
  if (options.isInNyc) {
    return evictionFreeDeclarationEmailFormalSubject(options);
  }

  // This is a very specific subject line format, outlined here:
  // http://www.nycourts.gov/eefpa/PDF/HardshipDeclarationCopy-1.8.pdf
  const parts = [options.fullLegalName, options.address];

  if (options.indexNumber) {
    parts.push(`No. ${options.indexNumber}`);
  }

  if (options.courtName) {
    parts.push(options.courtName);
  }

  if (options.county) {
    parts.push(`${options.county} County`);
  }

  return parts.join(" - ");
}

export const efnyDeclarationEmailToHousingCourtForTesting = {
  emailSubject,
};

export const EvictionFreeDeclarationEmailToHousingCourtStaticPage = asEmailStaticPage(
  (props) => (
    <TransformSession transformer={sessionToEvictionFreeDeclarationEmailProps}>
      {(props) => (
        <HtmlEmail subject={emailSubject(props)}>
          <p>Hello Court Clerk,</p>
          <p>
            Attached you will find the Hardship Declaration of{" "}
            {props.fullLegalName} submitted by them pursuant to the COVID-19
            Emergency Eviction and Foreclosure Prevention Act of 2020 on{" "}
            {props.dateSubmitted}.
          </p>
          {props.indexNumber && (
            <p>
              This declaration is to be referenced in conjunction with tenant’s
              existing case bearing Index #: {props.indexNumber}
            </p>
          )}
          {props.trackingNumber && (
            <p>
              This declaration has been sent to the tenant’s landlord by USPS
              Certified Mail with tracking number: {props.trackingNumber}.
            </p>
          )}
          <p>Thank you,</p>
          <p>{props.fullLegalName}</p>
          <br />
          <EvictionFreeEmailDisclaimer {...props} />
        </HtmlEmail>
      )}
    </TransformSession>
  )
);
