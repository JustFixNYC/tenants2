import React from 'react';

import Page from "../page";


export default class ExampleClientSideErrorPage extends React.Component {
  componentDidMount() {
    throw new Error(
      "This is an intentional error thrown during componentDidMount() to " +
      "make sure client-side error reporting works. You can safely ignore it."
    );
  }

  render() {
    return <Page title="Example client-side error page">
      This is an example client-side error page.
    </Page>;
  }
}
