import React from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";

type ServiceInstructionsProps = {
  firstName: string;
};

const ServiceInstructionsContent: React.FC<ServiceInstructionsProps> = (
  props
) => (
  <>
    <p>Hello {props.firstName},</p>
    <p>
      This is JustFix.nyc following up with some{" "}
      <strong>next steps and instructions</strong> now that you’ve filed an “HP
      Action” case in Housing Court for Repairs and/or Harassment.
    </p>
    <h2>Next steps</h2>
    <p>
      At this point, your signed paperwork has been sent to your borough’s
      Housing Court Clerk for review. This is what will happen next and what you
      need to do to make sure the process goes smoothly.
    </p>
    <ol>
      <li>
        <strong>Judge’s decision</strong>
        <p>
          The Clerk will present your paperwork to the Judge and the Judge will
          decide whether or not to accept your case.
        </p>
        <ol type="a">
          <li>
            <strong>If the Judge does NOT accept your case</strong>, your case
            will be rejected and you will get an email from the Clerk letting
            you know with an attachment, which is the rejected paperwork. On
            rare occasions, the Judge may have written on the documents to
            explain why your case was rejected or to tell you that you should
            file a different type of case.
          </li>
          <li>
            <strong>If the Judge accepts your case</strong>, you will get an
            email from the Clerk with an attachment. That attachment is the
            paperwork signed by the Judge. It contains a lot of valuable
            information. The most important piece of information is how to tell
            your landlord and/or management company that you are suing them.
            This is called “Service”.
          </li>
        </ol>
      </li>
      {/* TODO: FINISH THIS. */}
    </ol>
  </>
);

export const ServiceInstructionsEmail = asEmailStaticPage(() => (
  <HtmlEmail subject="HP Action: service instructions confirmation email">
    <ServiceInstructionsContent firstName="Boop" />
  </HtmlEmail>
));
