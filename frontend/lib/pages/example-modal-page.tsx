import React from 'react';
import Page from '../page';
import { Modal } from '../modal';
import { Link } from 'react-router-dom';


/* istanbul ignore next: this is tested by integration tests. */
export default function ExampleModalPage(): JSX.Element {
  return (
    <Page title="Example modal page">
      <p>Here is a page with a modal.</p>
      <Modal title="Example modal" onCloseGoTo="/">
        <p>This is an example modal.</p>
        <Link to="/">Here is an example link.</Link>
      </Modal>
    </Page>
  );
}
