import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import {
  evictionFreeDeclarationEmailFormalSubject,
  sessionToEvictionFreeDeclarationEmailProps,
} from "./declaration-email-utils";

export const EvictionFreeEmailDisclaimer: React.FC<{ fullName: string }> = (
  fullName
) => (
  <p>
    Note: {fullName} is submitting the attached Hardship Declaration to the
    Court using this JustFix.nyc email address. This email address is used
    solely for the purpose of submitting the Hardship Declaration and receiving
    confirmation of its receipt. This email address is not the Declarant's own
    email address and should not be used to communicate with the Declarant for
    any purpose apart from supplying confirmation of receipt of the attached
    Hardship Declaration.
  </p>
);

export const EvictionFreeDeclarationEmailToHousingCourtStaticPage = asEmailStaticPage(
  (props) => (
    <TransformSession transformer={sessionToEvictionFreeDeclarationEmailProps}>
      {(props) => (
        <HtmlEmail subject={evictionFreeDeclarationEmailFormalSubject(props)}>
          <p>Hello Court Clerk,</p>
          <p>
            Attached you will find the Hardship Declaration of {props.fullName}{" "}
            submitted by them pursuant to the COVID-19 Emergency Eviction and
            Foreclosure Prevention Act of 2020 on {props.dateSubmitted}.
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
          <p>Please kindly confirm receipt by replying all to this email.</p>
          <p>Thank you,</p>
          <p>{props.fullName}</p>
          <EvictionFreeEmailDisclaimer {...props} />
        </HtmlEmail>
      )}
    </TransformSession>
  )
);
