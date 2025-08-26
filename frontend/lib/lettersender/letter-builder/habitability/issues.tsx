import React from "react";
import { DjangoChoices, toDjangoChoices } from "../../../common-data";
import Page from "../../../ui/page";
import { Switch, Route } from "react-router";
import { ProgressButtons } from "../../../ui/buttons";
import { Accordion } from "../../../ui/accordion";
import { t, Trans } from "@lingui/macro";
import { li18n } from "../../../i18n-lingui";
import { MultiCheckboxFormField } from "../../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../../forms/session-updating-form-submitter";
import { AllSessionInfo } from "../../../queries/AllSessionInfo";
import { LetterSenderIssuesMutation } from "../../../queries/LetterSenderIssuesMutation";
import { ROUTE_PREFIX } from "../../../util/route-util";
import { PhoneNumber } from "../../components/phone-number";
import { OutboundLink } from "../../../ui/outbound-link";
import ResponsiveElement from "../../components/responsive-element";
import { logEvent } from "../../../analytics/util";
import { ga } from "../../../analytics/google-analytics";

// GCE issue choices from the lettersender backend
const GCE_ISSUE_CHOICES = [
  [
    "INFORM_RIGHTS",
    "I want to inform my landlord about my Good Cause Eviction rights",
  ],
  [
    "OVERCHARGE",
    "I am being overcharged for rent or will soon be overcharged for rent",
  ],
  ["EVICTION", "I am being evicted without reason"],
  ["NO_RENEWAL", "I am not being offered a lease renewal"],
] as const;

type GceIssueChoice = typeof GCE_ISSUE_CHOICES[number][0];

type LaIssuesPage = LaIssuesRoutesProps;

export const LaIssuesPage: React.FC<LaIssuesPage> = (props) => {
  const getInitialState = (session: AllSessionInfo) => ({
    gceIssues: session.gceIssues as string[],
  });

  return (
    <Page
      title={li18n._(t`Select the issues you want to address in your letter`)}
    >
      <ResponsiveElement className="mb-5" desktop="h3" touch="h1">
        <Trans>Select the issues you want to address in your letter</Trans>
      </ResponsiveElement>
      <ResponsiveElement desktop="h4" touch="h3">
        <Trans>
          Select all the issues that apply to your situation. You can select
          multiple options.
        </Trans>
      </ResponsiveElement>
      <div>
        <SessionUpdatingFormSubmitter
          confirmNavIfChanged
          mutation={LetterSenderIssuesMutation}
          initialState={getInitialState}
          onSuccessRedirect={props.toNext}
        >
          {(ctx) => (
            <>
              <div className="mt-11">
                <MultiCheckboxFormField
                  {...ctx.fieldPropsFor("gceIssues")}
                  label={li18n._(
                    t`Select all issues that apply to your situation`
                  )}
                  choices={GCE_ISSUE_CHOICES}
                  onChange={(choices, selectedChoice, checked) => {
                    logEvent("lettersender.issue.click", {
                      issueName: selectedChoice,
                      isChecked: checked,
                    });
                    ga(
                      "send",
                      "event",
                      "lettersender",
                      "issue-click",
                      `${selectedChoice}-${checked}`
                    );
                    ctx.fieldPropsFor("gceIssues").onChange(choices);
                  }}
                />
              </div>
              <h2 className="mt-11">
                <Trans>Common questions</Trans>
              </h2>
              <Accordion
                question={li18n._(
                  t`What if an issue I need to address is not listed?`
                )}
                extraClassName=""
                questionClassName="is-size-6 jf-has-text-underline"
              >
                <div className="content">
                  <Trans id="lettersender.issues.issueNotListed">
                    The Good Cause Eviction letter will formally document your
                    concerns. If you have additional issues beyond what is
                    listed here, it is important to maintain a proper paper
                    trail. Only contact your landlord or property management
                    company through email, text messages, or through certified
                    mail. If you do decide to call your landlord/property
                    manager, we recommend emailing or texting them details of
                    the conversation afterwards.
                  </Trans>
                </div>
              </Accordion>
              <Accordion
                question={li18n._(
                  t`Where can I add more details about my situation?`
                )}
                extraClassName=""
                questionClassName="is-size-6 jf-has-text-underline"
              >
                <div className="content">
                  <Trans id="lettersender.issues.addIssueDetails">
                    You can share more details with your landlord or property
                    management company through email, text messages, or through
                    certified mail. If you need legal assistance, consider
                    contacting a tenant rights organization or legal aid service
                    in your area.
                  </Trans>
                </div>
              </Accordion>
              <br />
              <ProgressButtons isLoading={ctx.isLoading} back={props.toBack} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
};

type LaIssuesRoutesProps = {
  routes: LaIssuesRouteInfo;
  introContent?: string | JSX.Element;
  toBack: string;
  toNext: string;
};

type LaIssuesRouteInfo = {
  [ROUTE_PREFIX]: string;
  home: string;
};

export function createLaIssuesRouteInfo(prefix: string): LaIssuesRouteInfo {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
  };
}

export function LaIssuesRoutes(props: LaIssuesRoutesProps): JSX.Element {
  const { routes } = props;
  return (
    <Switch>
      <Route
        path={routes.home}
        exact
        render={() => <LaIssuesPage {...props} />}
      />
    </Switch>
  );
}
