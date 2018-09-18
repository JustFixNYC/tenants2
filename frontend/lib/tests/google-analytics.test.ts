import { gtag, UNKNOWN_TRACKING_ID, trackPageView } from "../google-analytics";

describe('gtag()', () => {
  it('does not explode if window.gtag is undefined', () => {
    delete window.gtag;
    gtag('config', UNKNOWN_TRACKING_ID, { page_path: '/blah' });
  });

  it('calls window.gtag if it is defined', () => {
    const mockGtag = jest.fn();
    window.gtag = mockGtag;
    gtag('config', UNKNOWN_TRACKING_ID, { page_path: '/blah' });
    expect(mockGtag.mock.calls).toHaveLength(1);
    expect(mockGtag.mock.calls[0]).toEqual([
      'config', 'UNKNOWN', { page_path: '/blah' }
    ]);
    delete window.gtag;
  });
});

test('helper functions do not explode', () => {
  trackPageView('/blah');
});
