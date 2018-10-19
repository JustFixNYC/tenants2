import React from 'react';
import Routes from '../../routes';
import { AppTesterPal } from '../app-tester-pal';
import LetterOfComplaintRoutes from '../../letter-of-complaint';
import { LetterRequestMutation_output } from '../../queries/LetterRequestMutation';
import { LetterRequestMailChoice, LetterRequestInput } from '../../queries/globalTypes';

const PRE_EXISTING_LETTER_REQUEST = {
  mailChoice: LetterRequestMailChoice.WE_WILL_MAIL,
  updatedAt: 'blahh'
};

describe('landlord details page', () => {
  afterEach(AppTesterPal.cleanup);

  it('works when user chooses to mail the letter themselves', async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: Routes.loc.preview,
      session: { letterRequest: PRE_EXISTING_LETTER_REQUEST }
    });
    pal.clickButtonOrLink(/mail this myself/i);
    pal.expectFormInput<LetterRequestInput>({
      mailChoice: LetterRequestMailChoice.USER_WILL_MAIL
    });
    const updatedAt = "2018-01-01Tblahtime";
    const mailChoice = LetterRequestMailChoice.USER_WILL_MAIL;
    pal.respondWithFormOutput<LetterRequestMutation_output>({
      errors: [],
      session: { letterRequest: { updatedAt, mailChoice } }
    });

    await pal.rt.waitForElement(() => pal.rr.getByText(/Your letter of complaint has been created/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({ letterRequest: { updatedAt, mailChoice } });
  });

  it('shows confirmation modal when user wants us to mail the letter', async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: Routes.loc.preview,
      session: { letterRequest: PRE_EXISTING_LETTER_REQUEST }
    });
    pal.clickButtonOrLink(/ready to send/i);
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/ready to go/i));
  });
});
