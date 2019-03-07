import React from 'react';
import Routes from '../../routes';
import { LetterRequestMailChoice } from '../../queries/globalTypes';
import { AppTesterPal } from '../app-tester-pal';
import LetterOfComplaintRoutes from '../../letter-of-complaint';


describe('letter of complaint confirmation', () => {
  afterEach(AppTesterPal.cleanup);

  const createPal = (mailChoice: LetterRequestMailChoice) =>
    new AppTesterPal(<LetterOfComplaintRoutes/>, {
      url: Routes.locale.loc.confirmation,
      session: {
        letterRequest: {
          updatedAt: "2018-09-14T01:42:12.829983+00:00",
          mailChoice
        }
      }
    });

  it('mentions date of reception when we will mail', async () => {
    const pal = createPal(LetterRequestMailChoice.WE_WILL_MAIL);

    pal.rr.getByText(/Thursday, September 13, 2018/i);
  });

  it('tells user to print it out and mail it', async () => {
    const pal = createPal(LetterRequestMailChoice.USER_WILL_MAIL);

    pal.rr.getByText(/print out/i);
  });
});
