import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import {
  evictionFreeDeclarationEmailFormalSubject,
  sessionToEvictionFreeDeclarationEmailProps,
} from "./declaration-email-utils";

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
        </HtmlEmail>
      )}
    </TransformSession>
  )
);
