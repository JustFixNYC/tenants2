import React from 'react';
import { AppTesterPal } from "../../tests/app-tester-pal";
import DataDrivenOnboardingRoutes from '../data-driven-onboarding';
import Routes from '../../routes';
import { BlankDDOSuggestionsResult } from '../../queries/DDOSuggestionsResult';
import { DataDrivenOnboardingSuggestions_output } from '../../queries/DataDrivenOnboardingSuggestions';
import { createMockFetch } from '../../tests/mock-fetch';
import { FakeGeoResults } from '../../tests/util';
import { suppressSpuriousActErrors } from '../../tests/react-act-workaround';

async function simulateResponse(response: Partial<DataDrivenOnboardingSuggestions_output>|null) {
  const output: DataDrivenOnboardingSuggestions_output|null =
    response ? {...BlankDDOSuggestionsResult, ...response} : null;

  jest.useFakeTimers();
  const fetch = createMockFetch();
  const pal = new AppTesterPal(<DataDrivenOnboardingRoutes/>, {
    url: Routes.locale.dataDrivenOnboarding
  });
  await suppressSpuriousActErrors(async () => {
    await pal.nextTick();
    fetch.mockReturnJson(FakeGeoResults);
    pal.fillFormFields([[/address/i, '150 cou']]);
    await fetch.resolvePromisesAndTimers();
    pal.clickListItem(/150 COURT STREET/);
    pal.clickButtonOrLink(/gimme some info/i);
    pal.expectGraphQL(/ddoSuggestions/);
    pal.getFirstRequest().resolve({output});
    await pal.nextTick();
  });
  return pal;
}

describe('Data driven onboarding', () => {
  afterEach(AppTesterPal.cleanup);

  it('shows suggestions when they exist', async () => {
    const pal = await simulateResponse({unitCount: 5});
    pal.rr.getByText(/5 units/i);
  });

  it('apologizes when we could not find anything', async () => {
    const pal = await simulateResponse(null);
    pal.rr.getByText(/sorry, we don't recognize the address/i);
  });
});
