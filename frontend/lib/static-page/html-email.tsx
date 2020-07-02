import React from "react";
import i18n from "../i18n";
import { EmailSubject } from "./email-static-page";

const CSS = require("./html-email.css");

const EmailTable: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = (props) => {
  // This is largely needed to appease TypeScript, which
  // doesn't think some of these props are meant to be
  // on `<table>` elements, but which need to be in order
  // for the tables to render properly on all email clients.
  const nonStandardProps = {
    border: "0",
    cellPadding: "0",
    cellSpacing: "0",
  };
  return (
    <table
      role="presentation"
      {...nonStandardProps}
      className={props.className}
    >
      {props.children}
    </table>
  );
};

/**
 * An HTML email Call To Action (CTA).  This will appear as a big,
 * eye-catching button in the HTML version of the email.
 */
export const EmailCta: React.FC<{ href: string; children: string }> = (
  props
) => (
  <EmailTable className="btn btn-primary">
    <tbody>
      <tr>
        <td align="left">
          <EmailTable>
            <tbody>
              <tr>
                <td>
                  <a href={props.href} target="_blank">
                    {props.children}
                  </a>
                </td>
              </tr>
            </tbody>
          </EmailTable>
        </td>
      </tr>
    </tbody>
  </EmailTable>
);

type HtmlEmailProps = {
  /** The email's subject. */
  subject: string;

  /** The body of the email. */
  children: React.ReactNode;

  /** The optional footer content of the email. */
  footer?: JSX.Element;
};

const HtmlFooter: React.FC<{ children: React.ReactNode }> = (props) => (
  <div className="footer">
    <EmailTable>
      <tr>
        <td className="content-block">{props.children}</td>
      </tr>
    </EmailTable>
  </div>
);

/**
 * A `<td>` with a non-breaking space in it.  We're forcing
 * the space to be serialized as a literal `&nbsp;` rather than
 * a unicode character, because the latter triggers
 * a weird `[Message clipped]` on Gmail, and moreover deviates
 * from the source code of the original HTML email template
 * we're using.
 */
const EmptyTableDataCell: React.FC<{}> = () => (
  <td dangerouslySetInnerHTML={{ __html: "&nbsp;" }}></td>
);

/**
 * A simple responsive HTML email. This is based on Lee Munroe's template
 * at https://github.com/leemunroe/responsive-html-email-template.
 */
export const HtmlEmail: React.FC<HtmlEmailProps> = (props) => (
  <html lang={i18n.locale}>
    <head>
      <meta name="viewport" content="width=device-width" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>{props.subject}</title>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </head>
    <body className="">
      <span className="preheader">
        {/* This is preheader text. Some clients will show this text as a preview. */}
        {/* TODO: Should we actually put content here? */}
      </span>
      <EmailSubject value={props.subject} />
      <EmailTable className="body">
        <tr>
          <EmptyTableDataCell />
          <td className="container">
            <div className="content">
              <table role="presentation" className="main">
                <tr>
                  <td className="wrapper">
                    <EmailTable>
                      <tr>
                        <td>{props.children}</td>
                      </tr>
                    </EmailTable>
                  </td>
                </tr>
              </table>
              {props.footer && <HtmlFooter>{props.footer}</HtmlFooter>}
            </div>
          </td>
          <EmptyTableDataCell />
        </tr>
      </EmailTable>
    </body>
  </html>
);
