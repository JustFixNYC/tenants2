import React from "react";
import { StaticPage } from "../static-page";

export const ExampleStaticPagePDF: React.FC<{}> = () => (
  <StaticPage httpHeaders={{'Content-Type': 'application/pdf'}}>
    <html>
      {/* Yes, this is valid HTML5. */}
      <meta charSet="utf-8" />
      <title>This is an example static PDF page.</title>
      <p>Hello, this is an example static PDF page&hellip;</p>
    </html>
  </StaticPage>
);
