import React from 'react';
import Page from '../page';
import { Modal } from '../modal';


/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleModalPage(): JSX.Element {
  return (
    <Page title="Example modal page">
      <p>Here is a page with a modal.</p>
      <Modal title="Example modal">
        <div className="box content">
          <p>This is an example modal.</p>
        </div>
      </Modal>
    </Page>
  );
}
