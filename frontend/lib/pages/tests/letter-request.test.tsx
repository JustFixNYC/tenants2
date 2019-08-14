import React from 'react';
import Routes from '../../routes';
import { AppTesterPal } from '../../tests/app-tester-pal';
import LetterOfComplaintRoutes from '../../letter-of-complaint';
import { LetterRequestMutation_output } from '../../queries/LetterRequestMutation';
import { LetterRequestMailChoice, LetterRequestInput } from '../../queries/globalTypes';
import { pauseForModalFocus } from '../../tests/util';

const PRE_EXISTING_LETTER_REQUEST = {
  mailChoice: LetterRequestMailChoice.WE_WILL_MAIL,
  updatedAt: 'blahh'
};

describe('landlord details page', () => {
  afterEach(AppTesterPal.cleanup);

  async function clickButtonAndExpectChoice(pal: AppTesterPal, matcher: RegExp, mailChoice: LetterRequestMailChoice) {
    pal.clickButtonOrLink(matcher);
    pal.expectFormInput<LetterRequestInput>({ mailChoice });
    const updatedAt = "2018-01-01Tblahtime";
    pal.respondWithFormOutput<LetterRequestMutation_output>({
      errors: [],
      session: { letterRequest: { updatedAt, mailChoice } }
    });

    await pal.rt.waitForElement(() => pal.rr.getByText(/your letter of complaint .*/i));
    const { mock } = pal.appContext.updateSession;
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0][0]).toEqual({ letterRequest: { updatedAt, mailChoice } });
  }

  it('works when user chooses to mail the letter themselves', async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: Routes.locale.loc.preview,
      session: { letterRequest: PRE_EXISTING_LETTER_REQUEST }
    });
    clickButtonAndExpectChoice(pal, /mail this myself/i, LetterRequestMailChoice.USER_WILL_MAIL);
  });

  it('works when user wants us to mail the letter', async () => {
    const pal = new AppTesterPal(<LetterOfComplaintRoutes />, {
      url: Routes.locale.loc.preview,
      session: { letterRequest: PRE_EXISTING_LETTER_REQUEST }
    });
    pal.clickButtonOrLink(/looks good to me/i);
    await pal.rt.waitForElement(() => pal.getDialogWithLabel(/ready to go/i));

    await pauseForModalFocus();

    clickButtonAndExpectChoice(pal, /mail my letter/i, LetterRequestMailChoice.WE_WILL_MAIL);
  });
});
