import React from 'react';

import { LoadingPage } from '../loading-page';

export default class ExampleLoadingPage extends React.Component {
  render() {
    return <LoadingPage
      isLoading={true}
      pastDelay={true}
      timedOut={false}
      error={undefined}
      retry={() => {}}
    />;
  }
}
