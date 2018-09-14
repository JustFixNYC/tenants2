import ReactTestingLibraryPal from '../rtl-pal';
import { FakeSessionInfo } from '../util';
import Routes from '../../routes';
import { createLoCRoutes } from './landlord-details.test';
import { LetterRequestMailChoice } from '../../queries/globalTypes';
import { AllSessionInfo_letterRequest } from '../../queries/AllSessionInfo';
import { AppContextType } from '../../app-context';

function letterRequest(letterRequest: AllSessionInfo_letterRequest): Partial<AppContextType> {
  return {
    session: {
      ...FakeSessionInfo,
      letterRequest
    }
  };
}

describe('letter of complaint confirmation', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('mentions date of reception when we will mail', async () => {
    const pal = ReactTestingLibraryPal.render(createLoCRoutes(
      Routes.loc.confirmation,
      letterRequest({
        updatedAt: "2018-09-14T01:42:12.829983+00:00",
        mailChoice: LetterRequestMailChoice.WE_WILL_MAIL
      })
    ));
    pal.rr.getByText(/We've received your request .* Thursday, September 13, 2018/i);
  });

  it('tells user to print it out and mail it', async () => {
    const pal = ReactTestingLibraryPal.render(createLoCRoutes(
      Routes.loc.confirmation,
      letterRequest({
        updatedAt: "2018-09-14T01:42:12.829983+00:00",
        mailChoice: LetterRequestMailChoice.USER_WILL_MAIL
      })
    ));
    pal.rr.getByText(/print it out and mail it/i);
  });
});
