import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LaLetterBuilderRouteComponent } from "../routes";
import { LaLetterBuilderRouteInfo } from "../route-info";

// Mock the onboarding routes component
jest.mock("../../onboarding/routes", () => {
  return function MockOnboardingRoutes() {
    return <div data-testid="onboarding-routes">Onboarding Routes</div>;
  };
});

// Mock the dev routes component
jest.mock("../../dev/routes", () => {
  return function MockDevRoutes() {
    return <div data-testid="dev-routes">Dev Routes</div>;
  };
});

describe("LaLetterBuilderRouteComponent", () => {
  it("renders onboarding routes when navigating to onboarding path", () => {
    const { getByTestId } = render(
      <MemoryRouter
        initialEntries={[LaLetterBuilderRouteInfo.locale.onboarding.prefix]}
      >
        <LaLetterBuilderRouteComponent
          location={{
            pathname: LaLetterBuilderRouteInfo.locale.onboarding.prefix,
            search: "",
            hash: "",
            state: {},
          }}
          history={{} as any}
          match={{} as any}
        />
      </MemoryRouter>
    );

    expect(getByTestId("onboarding-routes")).toBeInTheDocument();
  });

  it("renders home page when navigating to home path", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={[LaLetterBuilderRouteInfo.locale.home]}>
        <LaLetterBuilderRouteComponent
          location={{
            pathname: LaLetterBuilderRouteInfo.locale.home,
            search: "",
            hash: "",
            state: {},
          }}
          history={{} as any}
          match={{} as any}
        />
      </MemoryRouter>
    );

    expect(getByText("For LA residents")).toBeInTheDocument();
  });
});
