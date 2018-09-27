import React from 'react';

import ReactTestingLibraryPal from "./rtl-pal";
import { IssueAutocomplete, doesAreaMatchSearch } from "../issue-search";

test('IssueAutocomplete works', () => {
  const mockChange = jest.fn();
  const pal = new ReactTestingLibraryPal(
    <IssueAutocomplete inputValue="" onInputValueChange={mockChange} />
  );

  pal.fillFormFields([[/search/i, "mice"]]);
  expect(mockChange.mock.calls).toHaveLength(1);
  pal.rr.rerender(
    <IssueAutocomplete inputValue="mice" onInputValueChange={mockChange} />
  );
  mockChange.mockClear();
  pal.clickListItem(/mice/i);
  expect(mockChange.mock.calls[1][0]).toBe('Entire home and hallways - Mice');

  pal.rr.rerender(
    <IssueAutocomplete inputValue="zzzzzzz" onInputValueChange={mockChange} />
  );
  expect(pal.rr.container.querySelector('li')).toBeNull();
});

test("doesAreaMatchSearch() works", () => {
  expect(doesAreaMatchSearch('HOME', 'heat')).toBe(true);
  expect(doesAreaMatchSearch('BATHROOMS', 'refrigerator')).toBe(false);
});
