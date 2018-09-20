import { ga, trackPageView } from "../google-analytics";

describe('ga()', () => {
  it('does not explode if window.ga is undefined', () => {
    delete window.ga;
    ga('set', 'page', '/blah');
  });

  it('calls window.ga if it is defined', () => {
    const mockGa = jest.fn();
    window.ga = mockGa;
    ga('set', 'page', '/blah');
    expect(mockGa.mock.calls).toHaveLength(1);
    expect(mockGa.mock.calls[0]).toEqual(['set', 'page', '/blah']);
    delete window.ga;
  });
});

test('helper functions do not explode', () => {
  trackPageView('/blah');
});
