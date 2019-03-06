import { LOCProgressRoutesProps } from '../letter-of-complaint';
import Routes from '../routes';
import { ProgressRoutesTester } from './progress-routes-tester';

const tester = new ProgressRoutesTester(LOCProgressRoutesProps, 'letter of complaint');

tester.defineSmokeTests();

describe('latest step redirector', () => {
  it('returns welcome page by default', () => {
    expect(tester.getLatestStep()).toBe(Routes.locale.loc.home);
  });

  it('returns confirmation page if letter request has been submitted', () => {
    expect(tester.getLatestStep({
      letterRequest: {} as any
    })).toBe(Routes.locale.loc.confirmation);
  });
});
