import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { TransformSession } from "../util/transform-session";
import { EvictionFreeEmailDisclaimer } from "./declaration-email-to-housing-court";
import {
  evictionFreeDeclarationEmailFormalSubject,
  sessionToEvictionFreeDeclarationEmailProps,
} from "./declaration-email-utils";

export const EvictionFreeDeclarationEmailToLandlordStaticPage = asEmailStaticPage(
  (props) => (
    <TransformSession transformer={sessionToEvictionFreeDeclarationEmailProps}>
      {(props) => (
        <HtmlEmail subject={evictionFreeDeclarationEmailFormalSubject(props)}>
          <p>Hello {props.landlordName},</p>
          <p>
            Attached you will find the Hardship Declaration for{" "}
            {props.fullLegalName} completed on {props.dateSubmitted}.
          </p>
          <p>
            With this declaration, {props.firstName} is protected from eviction
            proceedings pursuant to the COVID-19 Emergency Eviction and
            Foreclosure Prevention Act of 2020.
          </p>
          <p>
            A copy of this declaration has been sent to the court to be held as
            proof of completion.
          </p>
          <p>Thank you,</p>
          <p>{props.fullLegalName}</p>
          <br />
          <EvictionFreeEmailDisclaimer {...props} />
        </HtmlEmail>
      )}
    </TransformSession>
  )
);
