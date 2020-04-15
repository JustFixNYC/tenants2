import React from "react";
import { StaticPage } from "../static-page";

export const ExampleStaticPage: React.FC<{}> = () => (
  <StaticPage>
    <html>
      {/* Yes, this is valid HTML5. */}
      <meta charSet="utf-8" />
      <title>This is an example static page.</title>
      <p>Hello, this is an example static page&hellip;</p>
    </html>
  </StaticPage>
);
