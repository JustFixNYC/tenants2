import React from "react";
import i18n from "./i18n";
import {
  asEmailStaticPage,
  EmailSubject,
} from "./static-page/email-static-page";

const CSS = require("./responsive-html-email-template.css");

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

// https://github.com/leemunroe/responsive-html-email-template
const HtmlEmailTemplate: React.FC<{}> = () => (
  <html lang={i18n.locale}>
    <head>
      <meta name="viewport" content="width=device-width" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Simple Transactional Email</title>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </head>
    <body className="">
      <span className="preheader">
        {/* This is preheader text. Some clients will show this text as a preview. */}
      </span>
      <EmailSubject value="This is a test HTML email!" />
      <EmailTable className="body">
        <tr>
          <td>&nbsp;</td>
          <td className="container">
            <div className="content">
              {/* START CENTERED WHITE CONTAINER */}
              <table role="presentation" className="main">
                {/* START MAIN CONTENT AREA */}
                <tr>
                  <td className="wrapper">
                    <EmailTable>
                      <tr>
                        <td>
                          <p>Hi there,</p>
                          <p>
                            Sometimes you just want to send a simple HTML email
                            with a simple design and clear call to action. This
                            is it.
                          </p>
                          <EmailTable className="btn btn-primary">
                            <tbody>
                              <tr>
                                <td align="left">
                                  <EmailTable>
                                    <tbody>
                                      <tr>
                                        <td>
                                          {" "}
                                          <a
                                            href="http://htmlemail.io"
                                            target="_blank"
                                          >
                                            Call To Action
                                          </a>{" "}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </EmailTable>
                                </td>
                              </tr>
                            </tbody>
                          </EmailTable>
                          <p>
                            This is a really simple email template. Its sole
                            purpose is to get the recipient to click the button
                            with no distractions.
                          </p>
                          <p>Good luck! Hope it works.</p>
                        </td>
                      </tr>
                    </EmailTable>
                  </td>
                </tr>

                {/* END MAIN CONTENT AREA */}
              </table>
              {/* END CENTERED WHITE CONTAINER */}

              {/* START FOOTER */}
              <div className="footer">
                <EmailTable>
                  <tr>
                    <td className="content-block">
                      <span className="apple-link">
                        Company Inc, 3 Abbey Road, San Francisco CA 94102
                      </span>
                      <br />
                      Don't like these emails?{" "}
                      <a href="http://i.imgur.com/CScmqnj.gif">Unsubscribe</a>.
                    </td>
                  </tr>
                  <tr>
                    <td className="content-block powered-by">
                      Powered by <a href="http://htmlemail.io">HTMLemail</a>.
                    </td>
                  </tr>
                </EmailTable>
              </div>
              {/* END FOOTER */}
            </div>
          </td>
          <td>&nbsp;</td>
        </tr>
      </EmailTable>
    </body>
  </html>
);

export const HtmlEmailTemplateStaticPage = asEmailStaticPage(HtmlEmailTemplate);
