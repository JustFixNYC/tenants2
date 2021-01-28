import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";

export const EvictionFreeDeclarationEmailToLandlordStaticPage = asEmailStaticPage(
  (props) => (
    <HtmlEmail subject="TODO: set email to landlord subject line">
      <p>TODO: set email to landlord body</p>
    </HtmlEmail>
  )
);
