import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import JustfixRoutes from "../../justfix-routes";
import { BlankDDOSuggestionsResult } from "../../queries/DDOSuggestionsResult";
import {
  DataDrivenOnboardingSuggestions_output,
  DataDrivenOnboardingSuggestions,
} from "../../queries/DataDrivenOnboardingSuggestions";
import { createMockFetch } from "../../networking/tests/mock-fetch";
import { FakeGeoResults } from "../../tests/util";
import DataDrivenOnboardingPage, {
  isBuildingClassBorC,
} from "../data-driven-onboarding";
import { Route } from "react-router";
import { waitFor } from "@testing-library/react";

async function simulateResponse(
  response: Partial<DataDrivenOnboardingSuggestions_output> | null
) {
  const output: DataDrivenOnboardingSuggestions_output | null = response
    ? { ...BlankDDOSuggestionsResult, ...response }
    : null;

  jest.useFakeTimers();
  const fetch = createMockFetch();
  const pal = new AppTesterPal(
    (
      <Route
        path={JustfixRoutes.locale.home}
        exact
        component={DataDrivenOnboardingPage}
      />
    ),
    {
      url: JustfixRoutes.locale.home,
    }
  );
  fetch.mockReturnJson(FakeGeoResults);
  pal.fillFormFields([[/address/i, "150 cou"]]);
  jest.runAllTimers();
  await waitFor(() => pal.clickListItem(/150 COURT STREET/));
  pal.clickButtonOrLink(/search address/i);
  pal.withQuery(DataDrivenOnboardingSuggestions).respondWith({
    output,
  });
  return pal;
}

describe("Data driven onboarding", () => {
  

  it("shows suggestions when they exist", async () => {
    const pal = await simulateResponse({ unitCount: 5 });
    await waitFor(() => pal.rr.getByText(/No registration found./i));
  });

  it("apologizes when we could not find anything", async () => {
    const pal = await simulateResponse(null);
    await waitFor(() =>
      pal.rr.getByText(/sorry, we don't recognize the address/i)
    );
  });
});

test("isBuildingClassBorC() works", () => {
  // https://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html
  expect(isBuildingClassBorC(null)).toBe(false);
  expect(isBuildingClassBorC("C0")).toBe(true);
  expect(isBuildingClassBorC("B1")).toBe(true);
  expect(isBuildingClassBorC("D0")).toBe(false);
});
