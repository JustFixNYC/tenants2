import React from "react";
import i18n from "../i18n";
import { EmailSubject } from "./email-static-page";

const CSS = require("./html-email.css");

const EmailTable: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = (props) => {
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
  subject: string;
  children: React.ReactNode;
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

// https://github.com/leemunroe/responsive-html-email-template
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
          <td>&nbsp;</td>
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
          <td>&nbsp;</td>
        </tr>
      </EmailTable>
    </body>
  </html>
);
