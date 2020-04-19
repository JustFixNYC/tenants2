import React, { useContext } from "react";
import {
  ProgressStepRoute,
  MiddleProgressStep,
} from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { NorentRoutes } from "../routes";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { QueryOrVerifyPhoneNumberMutation } from "../../queries/QueryOrVerifyPhoneNumberMutation";
import { PhoneNumberAccountStatus } from "../../queries/globalTypes";
import { NorentAccountRouteInfo } from "./routes";
import { assertNotNull, exactSubsetOrDefault } from "../../util/util";
import { PhoneNumberFormField } from "../../forms/phone-number-form-field";
import { ProgressButtons, NextButton } from "../../ui/buttons";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../../progress/progress-routes";
import {
  NorentFullNameMutation,
  BlankNorentFullNameInput,
} from "../../queries/NorentFullNameMutation";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";
import {
  NorentCityStateMutation,
  BlankNorentCityStateInput,
} from "../../queries/NorentCityStateMutation";
import { USStateFormField } from "../../forms/mailing-address-fields";
import { CustomerSupportLink } from "../../ui/customer-support-link";
import { LegacyFormSubmitter } from "../../forms/legacy-form-submitter";
import {
  PasswordResetVerificationCodeMutation,
  BlankPasswordResetVerificationCodeInput,
} from "../../queries/PasswordResetVerificationCodeMutation";
import { LoginMutation, BlankLoginInput } from "../../queries/LoginMutation";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { CenteredButtons } from "../../ui/centered-buttons";
import { Link, Route } from "react-router-dom";
import { PasswordResetMutation } from "../../queries/PasswordResetMutation";
import { AppContext } from "../../app-context";
import { LogoutMutation } from "../../queries/LogoutMutation";
import {
  PasswordResetConfirmAndLoginMutation,
  BlankPasswordResetConfirmAndLoginInput,
} from "../../queries/PasswordResetConfirmAndLoginMutation";

const Todo: React.FC<{ title: string }> = ({ title }) => (
  <Page title={`TODO: ${title}`} withHeading />
);

function getNorentAccountRoutes(): NorentAccountRouteInfo {
  return NorentRoutes.locale.account;
}

const temporaryGoHome = () => getNorentAccountRoutes().phoneNumber;

function getRouteForAccountStatus(status: PhoneNumberAccountStatus): string {
  const routes = getNorentAccountRoutes();

  switch (status) {
    case PhoneNumberAccountStatus.NO_ACCOUNT:
      return routes.name;
    case PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD:
      return routes.verifyPassword;
    case PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD:
      return routes.verifyPhoneNumber;
  }
}

const ForgotPasswordModal: React.FC<{}> = () => {
  const routes = getNorentAccountRoutes();
  const { session } = useContext(AppContext);

  return (
    <Modal
      title="Reset your password"
      onCloseGoTo={BackOrUpOneDirLevel}
      withHeading
      render={(modalCtx) => (
        <>
          <div className="content">
            <p>
              To begin the password reset process, we'll text you a verification
              code.
            </p>
          </div>
          <LegacyFormSubmitter
            formId="resetPassword"
            mutation={PasswordResetMutation}
            initialState={{ phoneNumber: session.lastQueriedPhoneNumber || "" }}
            onSuccessRedirect={routes.verifyPhoneNumber}
          >
            {(ctx) => (
              <>
                <HiddenFormField {...ctx.fieldPropsFor("phoneNumber")} />
                <CenteredButtons>
                  <NextButton isLoading={ctx.isLoading} label="Send code" />
                  <Link
                    {...modalCtx.getLinkCloseProps()}
                    className="button is-text"
                  >
                    Go back
                  </Link>
                </CenteredButtons>
              </>
            )}
          </LegacyFormSubmitter>
        </>
      )}
    />
  );
};

const VerifyPassword = () => {
  const routes = getNorentAccountRoutes();

  return (
    <Page title="You already have an account" withHeading="big">
      <div className="content">
        <p>
          Now we just need your password. (If you've used JustFix.nyc, this is
          the same password you use there.)
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        formId="login"
        mutation={LoginMutation}
        initialState={(s) => ({
          ...BlankLoginInput,
          phoneNumber: s.lastQueriedPhoneNumber || "",
        })}
        onSuccessRedirect={(output, input) => {
          return temporaryGoHome();
        }}
      >
        {(ctx) => (
          <>
            <HiddenFormField {...ctx.fieldPropsFor("phoneNumber")} />
            <TextualFormField
              label="Password"
              type="password"
              {...ctx.fieldPropsFor("password")}
            />
            <div className="content">
              <p>
                If you don't remember it, you can{" "}
                <Link to={routes.forgotPasswordModal}>reset your password</Link>
                .
              </p>
            </div>
            <ProgressButtons
              isLoading={ctx.isLoading}
              back={routes.phoneNumber}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={routes.forgotPasswordModal}
        component={ForgotPasswordModal}
        exact
      />
    </Page>
  );
};

const SetPassword = () => {
  const routes = getNorentAccountRoutes();

  return (
    <Page title="Set your new password">
      <h1 className="title is-4 is-spaced">Set your password</h1>
      <p className="subtitle is-6">
        Let's set you up with a new password, so you can easily login again.
      </p>
      <SessionUpdatingFormSubmitter
        mutation={PasswordResetConfirmAndLoginMutation}
        initialState={BlankPasswordResetConfirmAndLoginInput}
        onSuccessRedirect={temporaryGoHome()}
      >
        {(ctx) => (
          <>
            <TextualFormField
              type="password"
              label="New password"
              {...ctx.fieldPropsFor("password")}
            />
            <TextualFormField
              type="password"
              label="Confirm your new password"
              {...ctx.fieldPropsFor("confirmPassword")}
            />
            <br />
            <ProgressButtons
              back={routes.verifyPhoneNumber}
              isLoading={ctx.isLoading}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};

const VerifyPhoneNumber = () => {
  const routes = getNorentAccountRoutes();

  return (
    <Page title="Verify your phone number" withHeading="big">
      <div className="content">
        <p>
          We've just sent you a text message containing a verification code.
          Please enter it below.
        </p>
      </div>
      <LegacyFormSubmitter
        mutation={PasswordResetVerificationCodeMutation}
        initialState={BlankPasswordResetVerificationCodeInput}
        onSuccessRedirect={routes.setPassword}
      >
        {(ctx) => (
          <>
            <TextualFormField
              label="Verification code"
              {...ctx.fieldPropsFor("code")}
            />
            <div className="content">
              <p>
                If you didn't receive a code, please contact{" "}
                <CustomerSupportLink />.
              </p>
            </div>

            <ProgressButtons
              isLoading={ctx.isLoading}
              back={routes.phoneNumber}
            />
          </>
        )}
      </LegacyFormSubmitter>
    </Page>
  );
};

const DebugArea = () => {
  const session = useContext(AppContext).session;

  return (
    <SessionUpdatingFormSubmitter
      mutation={LogoutMutation}
      initialState={{}}
      onSuccessRedirect={temporaryGoHome()}
    >
      {(ctx) => {
        return (
          <>
            <hr />
            <div className="content">
              {session.phoneNumber ? (
                <p>
                  Currently logged in with phone number: {session.phoneNumber}
                </p>
              ) : (
                <p>Not logged in.</p>
              )}
              <p>Last queried phone number: {session.lastQueriedPhoneNumber}</p>
              <button type="submit" className="button">
                clear session/logout
              </button>
            </div>
          </>
        );
      }}
    </SessionUpdatingFormSubmitter>
  );
};

const AskPhoneNumber = () => {
  return (
    <Page title="Your phone number" withHeading="big">
      <div className="content">
        <p>
          Whether it's your first time here, or you're a returning user, let's
          start with your number.
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={QueryOrVerifyPhoneNumberMutation}
        initialState={(s) => ({ phoneNumber: s.lastQueriedPhoneNumber || "" })}
        onSuccessRedirect={(output) =>
          getRouteForAccountStatus(assertNotNull(output.accountStatus))
        }
      >
        {(ctx) => (
          <>
            <PhoneNumberFormField
              {...ctx.fieldPropsFor("phoneNumber")}
              label="Phone number"
            />
            <ProgressButtons
              isLoading={ctx.isLoading}
              back={temporaryGoHome()}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <DebugArea />
    </Page>
  );
};

const AskName = MiddleProgressStep((props) => {
  const routes = getNorentAccountRoutes();

  return (
    <Page title="Welcome!" withHeading="big">
      <div className="content">
        <p>Let's start off by getting to know you.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentFullNameMutation}
        initialState={(s) =>
          exactSubsetOrDefault(s.norentScaffolding, BlankNorentFullNameInput)
        }
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
            <ProgressButtons
              isLoading={ctx.isLoading}
              back={routes.phoneNumber}
            />
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
        initialState={(s) =>
          exactSubsetOrDefault(s.norentScaffolding, BlankNorentCityStateInput)
        }
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

export function createNorentAccountSteps(): ProgressStepRoute[] {
  const routes = getNorentAccountRoutes();

  return [
    {
      path: routes.phoneNumber,
      exact: true,
      component: AskPhoneNumber,
    },
    {
      path: routes.verifyPassword,
      component: VerifyPassword,
    },
    {
      path: routes.verifyPhoneNumber,
      exact: true,
      component: VerifyPhoneNumber,
    },
    {
      path: routes.setPassword,
      exact: true,
      component: SetPassword,
    },
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
