import React from 'react';

import Page from "../page";

/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleLoadablePage(): JSX.Element {
  console.log(
    "This logging statement exists to make sure that logging statements " +
    "can be made from code without messing anything up on the server or " +
    "client side. Please do not remove it."
  );
  return <Page title="Example loadable page">This is an example loadable page.</Page>;
}
