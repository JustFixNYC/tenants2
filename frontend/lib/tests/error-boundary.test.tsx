import React from 'react';
import { mount } from 'enzyme';

import { getErrorString, ErrorBoundary } from '../error-boundary';


test('getErrorString() works', () => {
  expect(getErrorString(null)).toBe('Unknown error');
  expect(getErrorString({ stack: 'bleh' })).toBe('bleh');
  expect(getErrorString({ toString() { return 'boop' } })).toBe('boop');
  expect(getErrorString({ toString() { throw new Error() } })).toBe('Unknown error');
});

describe('ErrorBoundary', () => {
  const ERR_MSG = 'my error';
  const COMPONENT_STACK = 'my component stack';

  const simulateError = (props: { debug: boolean }) => {
    // We can't easily test the exception-catching ability of this right now:
    // https://github.com/airbnb/enzyme/issues/1255

    const boundary = mount(<ErrorBoundary {...props}>boop</ErrorBoundary>);
    const instance = boundary.instance();
    if (!instance.componentDidCatch) {
      throw new Error('expected error boundary to have componentDidCatch method');
    }
    instance.componentDidCatch(new Error(ERR_MSG), {
      componentStack: COMPONENT_STACK
    });
    return boundary;
  };

  it('renders children', () => {
    const boundary = mount(<ErrorBoundary debug={false}><p>hi</p></ErrorBoundary>);
    expect(boundary.html()).toContain('hi');
  });

  it('shows error details when debug is true', () => {
    const html = simulateError({ debug: true }).html();
    expect(html).toContain(ERR_MSG);
    expect(html).toContain(COMPONENT_STACK);
  });

  it('does not show error details when debug is false', () => {
    const html = simulateError({ debug: false }).html();
    expect(html).not.toContain(ERR_MSG);
    expect(html).not.toContain(COMPONENT_STACK);
  });
});
