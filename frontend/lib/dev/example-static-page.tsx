import React from "react";
import { StaticPage } from "../static-page/static-page";

const Page: React.FC<{ format: string }> = ({ format }) => (
  <html>
    {/* Yes, this is valid HTML5. */}
    <meta charSet="utf-8" />
    <title>This is an example static {format} page.</title>
    <p>Hello, this is an example static {format} page&hellip;</p>
  </html>
);

export const ExampleStaticPageHTML: React.FC<{}> = () => (
  <StaticPage>
    <Page format="HTML" />
  </StaticPage>
);

export const ExampleStaticPagePDF: React.FC<{}> = () => (
  <StaticPage httpHeaders={{ "Content-Type": "application/pdf" }}>
    <Page format="PDF" />
  </StaticPage>
);
