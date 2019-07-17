import React from 'react';
import { AppTesterPal } from "../../tests/app-tester-pal";
import DataRequestsRoutes from "../data-requests";
import Routes from '../../routes';
import { DataRequestMultiLandlordQuery } from '../../queries/DataRequestMultiLandlordQuery';

const SUPPRESSED_PREFIXES = [
  "Warning: Do not await the result of calling ReactTestUtils.act(...)",
  "Warning: An update to %s inside a test was not wrapped in act(...)",
];

function isSuppressedErrorMessage(message: string): boolean {
  return SUPPRESSED_PREFIXES.some(sp => message.startsWith(sp));
}

/**
 * This is a workaround for the following issue:
 * 
 *   https://github.com/testing-library/react-testing-library/issues/281
 * 
 * It *should* be fixed in React 16.9, at which point we can remove this.
 */
async function suppressSpuriousActErrors(cb: () => Promise<any>): Promise<any> {
  const oldError = window.console.error;

  window.console.error = (...args: any[]) => {
    if (!isSuppressedErrorMessage(args[0])) {
        oldError(...args);
    }
  };

  try {
    await cb();
  } finally {
    window.console.error = oldError;
  }
}

describe('Data requests', () => {
  afterEach(AppTesterPal.cleanup);

  it('should work', async () => {
    const pal = new AppTesterPal(<DataRequestsRoutes/>, {
      url: Routes.locale.dataRequests.multiLandlord
    });
    pal.fillFormFields([[/landlords/i, "Boop Jones"]]);
    pal.clickButtonOrLink(/request data/i);

    pal.expectGraphQL(/DataRequestMultiLandlordQuery/);
    const response: DataRequestMultiLandlordQuery = {
      output: {
        csvSnippet: 'blargh',
        csvUrl: 'http://boop'
      }
    };

    await suppressSpuriousActErrors(async () => {
      pal.getFirstRequest().resolve(response);
      await pal.nextTick();
    });

    pal.rr.getByText(/blargh/);
  });
});
