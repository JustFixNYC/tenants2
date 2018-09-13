import ReactTestingLibraryPal from '../rtl-pal';
import { createTestGraphQlClient } from '../util';
import Routes from '../../routes';
import { createLoCRoutes } from './landlord-details.test';


describe('landlord details page', () => {
  afterEach(ReactTestingLibraryPal.cleanup);

  it('redirects to next step after successful submission', async () => {
    const { client } = createTestGraphQlClient();
    const updateSession = jest.fn();
    const pal = ReactTestingLibraryPal.render(createLoCRoutes(Routes.loc.preview, {
      fetch: client.fetch,
      updateSession
    }));
    pal.clickButtonOrLink('Finish');
    const updatedAt = "2018-01-01Tblahtime";
    const mailChoice = "WE_WILL_MAIL";
    client.getRequestQueue()[0].resolve({ output: {
      errors: [],
      session: { letterRequest: { updatedAt, mailChoice } }
    }});

    await pal.rt.waitForElement(() => pal.rr.getByText(/Your letter of complaint has been created/i));
    expect(updateSession.mock.calls).toHaveLength(1);
    expect(updateSession.mock.calls[0][0]).toEqual({ letterRequest: { updatedAt, mailChoice } });
  });
});
