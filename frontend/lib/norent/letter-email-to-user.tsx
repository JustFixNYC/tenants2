import React from "react";

import { useContext } from "react";
import { AppContext } from "../app-context";
import {
  EmailSubject,
  asEmailStaticPage,
} from "../static-page/email-static-page";
import { NorentRoutes } from "./routes";

export const NorentLetterEmailToUser: React.FC<{}> = () => {
  const { session, server } = useContext(AppContext);
  const faqURL = `${server.originURL}${NorentRoutes.locale.faqs}`;

  return (
    <>
      <EmailSubject value="Here's a copy of your NoRent letter" />
      <p>Hello {session.firstName},</p>
      <p>
        You've sent your NoRent letter. Attached to this email is a PDF copy for
        your records.
      </p>
      <p>
        To learn more about what to do next, check out our FAQ page: {faqURL}
      </p>
    </>
  );
};

export const NorentLetterEmailToUserStaticPage = asEmailStaticPage(
  NorentLetterEmailToUser
);
