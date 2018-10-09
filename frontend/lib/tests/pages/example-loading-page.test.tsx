import React from 'react';

import { AppTesterPal } from "../app-tester-pal";
import ExampleLoadingPage from "../../pages/example-loading-page";

test("example loading page works", () => {
  const pal = new AppTesterPal(
    <ExampleLoadingPage />
  );
  pal.clickRadioOrCheckbox('mount');
  pal.clickRadioOrCheckbox('error');
  pal.clickButtonOrLink('Retry');
});
