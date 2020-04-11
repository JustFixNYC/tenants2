import { fbq } from "../facebook-pixel";

describe('fbq()', () => {
  describe('if window.fbq is undefined', () => {
    beforeEach(() => {
      delete window.fbq;
    });

    it('does not explode', () => {
      fbq('trackCustom', 'NewUserSignup');
    });
  });

  it('calls window.fbq if it is defined', () => {
    const mockFbq = jest.fn();
    window.fbq = mockFbq;
    fbq('trackCustom', 'NewUserSignup');
    expect(mockFbq.mock.calls).toHaveLength(1);
    expect(mockFbq.mock.calls[0]).toEqual(['trackCustom', 'NewUserSignup']);
    delete window.ga;
  });
});
