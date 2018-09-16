import React from 'react';

import Routes from '../../routes';
import LetterOfComplaintRoutes from '../../letter-of-complaint';
import { AppTesterPal } from '../app-tester-pal';
import { LandlordDetailsMutation_output } from '../../queries/LandlordDetailsMutation';


describe('landlord details page', () => {
  afterEach(AppTesterPal.cleanup);

  it('redirects to next step after successful submission', async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: Routes.loc.yourLandlord,
    });
    const name = "Boop Jones";
    const address = "123 Boop Way\nBoopville, NY 11299";

    pal.fillFormFields([
      [/name/i, name],
      [/address/i, address]
    ]);
    pal.clickButtonOrLink('Preview letter');
    pal.respondWithFormOutput<LandlordDetailsMutation_output>({
      errors: [],
      session: { landlordDetails: { name, address } }
    });

    await pal.rt.waitForElement(() => pal.rr.getByText(/Review the letter of complaint/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({ landlordDetails: { name, address } });
  });
});
