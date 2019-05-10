import { fbq } from "../faceboox-pixel";

describe('fbq()', () => {
  describe('if window.fbq is undefined', () => {
    beforeEach(() => {
      delete window.fbq;
    });

    it('does not explode', () => {
      fbq('track', 'CompleteRegistration');
    });
  });

  it('calls window.fbq if it is defined', () => {
    const mockFbq = jest.fn();
    window.fbq = mockFbq;
    fbq('track', 'CompleteRegistration');
    expect(mockFbq.mock.calls).toHaveLength(1);
    expect(mockFbq.mock.calls[0]).toEqual(['track', 'CompleteRegistration']);
    delete window.ga;
  });
});
