import React from 'react';
import GraphQlClient from "../graphql-client";
import { AppServerInfo, AppContextType } from "../app-context";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import { shallow, ShallowWrapper, mount, ReactWrapper } from "enzyme";
import { MemoryRouter } from "react-router";

interface TestClient {
  mockFetch: jest.Mock;
  client: GraphQlClient;
}

/**
 * Creates a GraphQL client useful for testing. It will never hit the network
 * because the fetch implementation it uses is a Jest mock.
 * 
 * @param enableTimeout Whether to enable the client's timeout-based fetch logic.
 *   If disabled (the default), your tests will need to manually tell the client
 *   to fetch queued requests.
 */
export function createTestGraphQlClient(enableTimeout: boolean = false): TestClient {
  const timeoutMs = enableTimeout ? undefined : null;
  const mockFetch = jest.fn()
    .mockName('fetch')
    .mockReturnValue(new Promise(() => {}));
  const client = new GraphQlClient('/mygraphql', 'mycsrf', timeoutMs, mockFetch);
  return { client, mockFetch };
}

export function shallowWithRouter(child: JSX.Element): { wrapper: ShallowWrapper } {
  const wrapper = shallow(<MemoryRouter>{child}</MemoryRouter>);
  return { wrapper };
}

export function mountWithRouter(child: JSX.Element): { wrapper: ReactWrapper } {
  const wrapper = mount(<MemoryRouter>{child}</MemoryRouter>);
  return { wrapper };
}

export const FakeServerInfo: Readonly<AppServerInfo> = {
  staticURL: '/mystatic/',
  webpackPublicPathURL: '/mystatic/myfrontend/',
  adminIndexURL: '/myadmin/',  
  debug: false,
  batchGraphQLURL: '/mygarphql'
};

export const FakeSessionInfo: Readonly<AllSessionInfo> = {
  phoneNumber: null,
  csrfToken: 'mycsrf',
  isStaff: false,
  onboardingStep1: null,
  onboardingStep2: null
};

export const FakeAppContext: AppContextType = {
  server: FakeServerInfo,
  session: FakeSessionInfo
};

export const FakeDebugAppContext: AppContextType = {
  ...FakeAppContext,
  server: {
    ...FakeAppContext.server,
    debug: true
  }
};
