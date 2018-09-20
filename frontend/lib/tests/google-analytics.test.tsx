import React from 'react';
import { ga, trackPageView, OutboundLink, handleOutboundLinkClick } from "../google-analytics";
import ReactTestingLibraryPal from "./rtl-pal";

describe('ga()', () => {
  describe('if window.ga is undefined', () => {
    beforeEach(() => {
      delete window.ga;
      jest.useFakeTimers();
    });

    it('does not explode', () => {
      ga('set', 'page', '/blah');
    });

    it('calls any hit callbacks almost immediately', () => {
      const hitCallback = jest.fn();
      ga('send', 'event', 'outbound', 'click', 'https://boop.com/', {
        transport: 'beacon',
        hitCallback
      });
      expect(hitCallback.mock.calls).toHaveLength(0);
      jest.advanceTimersByTime(10);
      expect(hitCallback.mock.calls).toHaveLength(1);
    });
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

describe('OutboundLink', () => {
  let ga = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    window.ga = ga = jest.fn();
  });

  it('sends hit to GA on click', () => {
    const pal = new ReactTestingLibraryPal(
      <OutboundLink href="https://boop.com/">boop</OutboundLink>
    );
    pal.clickButtonOrLink('boop');
    expect(ga.mock.calls).toHaveLength(1);
    expect(ga.mock.calls[0].slice(0, 5)).toEqual([
      'send', 'event', 'outbound', 'click', 'https://boop.com/'
    ]);
  });

  it('prevents default click behavior when using GA', () => {
    const preventDefault = jest.fn();
    const e = { currentTarget: { href: 'blah' }, preventDefault } as any;
    handleOutboundLinkClick(e);
    expect(ga.mock.calls).toHaveLength(1);
    expect(preventDefault.mock.calls).toHaveLength(1);
  });

  it('does nothing when a modifier key is pressed', () => {
    const preventDefault = jest.fn();
    const e = { shiftKey: true, preventDefault } as any;
    handleOutboundLinkClick(e);
    expect(ga.mock.calls).toHaveLength(0);
    expect(preventDefault.mock.calls).toHaveLength(0);
  });
});
