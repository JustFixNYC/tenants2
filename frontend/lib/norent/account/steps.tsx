import React, { useContext } from "react";
import {
  ProgressStepRoute,
  MiddleProgressStep,
  ProgressStepProps,
} from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { NorentRoutes } from "../routes";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentAccountRouteInfo } from "./routes";
import { assertNotNull, exactSubsetOrDefault } from "../../util/util";
import { ProgressButtons } from "../../ui/buttons";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import { NorentFullNameMutation } from "../../queries/NorentFullNameMutation";
import { TextualFormField } from "../../forms/form-fields";
import {
  NorentCityStateMutation,
  BlankNorentCityStateInput,
} from "../../queries/NorentCityStateMutation";
import { USStateFormField } from "../../forms/mailing-address-fields";
import { createStartAccountOrLoginSteps } from "../start-account-or-login/steps";
import { Link, Route } from "react-router-dom";
import { AppContext } from "../../app-context";
import { LogoutMutation } from "../../queries/LogoutMutation";

const Todo: React.FC<{ title: string }> = ({ title }) => (
  <Page title={`TODO: ${title}`} withHeading />
);

function getNorentAccountRoutes(): NorentAccountRouteInfo {
  return NorentRoutes.locale.account;
}

const AskName = MiddleProgressStep((props) => {
  return (
    <Page title="Welcome!" withHeading="big">
      <div className="content">
        <p>Let's start off by getting to know you.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentFullNameMutation}
        initialState={(s) => ({
          firstName: s.norentScaffolding?.firstName || s.firstName || "",
          lastName: s.norentScaffolding?.lastName || s.lastName || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("firstName")}
              label="First name"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("lastName")}
              label="Last name"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});

const NYC_CITIES = [
  "nyc",
  "new york city",
  "new york",
  "ny",
  "manhattan",
  "queens",
  "brooklyn",
  "staten island",
  "bronx",
  "the bronx",
];

function isCityInNYC(city: string): boolean {
  return NYC_CITIES.includes(city.toLowerCase().trim());
}

function getRouteForMailingAddress({
  city,
  state,
}: {
  city: string;
  state: string;
}): string {
  const routes = getNorentAccountRoutes();

  if (state === "NY" && isCityInNYC(city)) {
    return routes.nycAddress;
  }
  return routes.nationalAddress;
}

const AskCityState = MiddleProgressStep((props) => {
  return (
    <Page
      title="What part of the United States do you live in?"
      withHeading="big"
    >
      <SessionUpdatingFormSubmitter
        mutation={NorentCityStateMutation}
        initialState={(s) => ({
          city: s.onboardingInfo?.city || s.norentScaffolding?.city || "",
          state: s.onboardingInfo?.state || s.norentScaffolding?.state || "",
        })}
        onSuccessRedirect={(output) =>
          getRouteForMailingAddress(
            assertNotNull(assertNotNull(output.session).norentScaffolding)
          )
        }
      >
        {(ctx) => (
          <>
            <TextualFormField {...ctx.fieldPropsFor("city")} label="City" />
            <USStateFormField {...ctx.fieldPropsFor("state")} />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});

const Welcome: React.FC<ProgressStepProps> = (props) => (
  <Page title="Build your letter" withHeading="big" className="content">
    <p>This is gonna be awesome!</p>
    <Link to={assertNotNull(props.nextStep)} className="button is-primary">
      Next
    </Link>
    <DebugArea />
  </Page>
);

const DebugArea = () => {
  const session = useContext(AppContext).session;

  return (
    <Route
      render={(props) => (
        <SessionUpdatingFormSubmitter
          mutation={LogoutMutation}
          initialState={{}}
          onSuccessRedirect={props.location.pathname}
        >
          {(ctx) => (
            <div className="content">
              <hr />
              <p>
                <code>DEBUG INFO</code>
              </p>
              {session.phoneNumber ? (
                <p>
                  Currently logged in with phone number: {session.phoneNumber}
                </p>
              ) : (
                <p>Not logged in.</p>
              )}
              <p>
                Last queried phone number:{" "}
                {session.lastQueriedPhoneNumber || "none"}
              </p>
              <button type="submit" className="button is-light">
                Clear session/logout
              </button>
            </div>
          )}
        </SessionUpdatingFormSubmitter>
      )}
    />
  );
};

export function createNorentAccountSteps(): ProgressStepRoute[] {
  const routes = getNorentAccountRoutes();

  return [
    {
      path: routes.welcome,
      exact: true,
      component: Welcome,
    },
    ...createStartAccountOrLoginSteps({
      routes,
      toPreviousPhase: routes.welcome,
      toNextPhase: routes.name,
    }),
    {
      path: routes.name,
      exact: true,
      component: AskName,
    },
    {
      path: routes.city,
      exact: true,
      component: AskCityState,
    },
    {
      path: routes.nationalAddress,
      exact: true,
      render: () => <Todo title="Ask user for their non-NYC address" />,
    },
    {
      path: routes.nycAddress,
      exact: true,
      render: () => <Todo title="Ask user for their NYC address" />,
    },
    {
      path: routes.email,
      exact: true,
      render: () => <Todo title="Ask user for their email" />,
    },
    {
      path: routes.create,
      exact: true,
      render: () => (
        <Todo title="Ask user for a password and to create account" />
      ),
    },
    {
      path: routes.update,
      exact: true,
      render: () => <Todo title="Prompt user to update their account" />,
    },
  ];
}

export const getNorentAccountProgressRoutesProps = (): ProgressRoutesProps => ({
  toLatestStep: NorentRoutes.locale.account.latestStep,
  label: "Your account",
  welcomeSteps: [],
  stepsToFillOut: [...createNorentAccountSteps()],
  confirmationSteps: [],
});

export const NorentAccountRoutes = buildProgressRoutesComponent(
  getNorentAccountProgressRoutesProps
);
