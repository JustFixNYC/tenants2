import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";

export const EvictionFreeDeclarationEmailToHousingCourtStaticPage = asEmailStaticPage(
  (props) => (
    <HtmlEmail subject="TODO: set email to housing court subject line">
      <p>TODO: set email to housing court body</p>
    </HtmlEmail>
  )
);
