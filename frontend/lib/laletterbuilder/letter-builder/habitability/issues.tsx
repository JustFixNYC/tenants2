import React from "react";
import { DjangoChoices, toDjangoChoices } from "../../../common-data";
import Page from "../../../ui/page";
import { Switch, Route } from "react-router";
import { ProgressButtons } from "../../../ui/buttons";
import { Accordion } from "../../../ui/accordion";
import {
  getLaIssueCategoryChoiceLabels,
  LaIssueCategoryChoice,
  LaIssueCategoryChoices,
} from "../../../../../common-data/issue-category-choices-laletterbuilder";
import {
  getLaIssueRoomChoiceLabels,
  LaIssueRoomChoice,
} from "../../../../../common-data/issue-room-choices-laletterbuilder";

import {
  getLaIssueChoiceLabels,
  LaIssueChoice,
  LaIssueChoices,
} from "../../../../../common-data/issue-choices-laletterbuilder";
import { t, Trans } from "@lingui/macro";
import { li18n } from "../../../i18n-lingui";
import { MultiCheckboxFormField } from "../../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../../forms/session-updating-form-submitter";
import { AllSessionInfo } from "../../../queries/AllSessionInfo";
import { LaLetterBuilderIssuesMutation } from "../../../queries/LaLetterBuilderIssuesMutation";
import { ROUTE_PREFIX } from "../../../util/route-util";
import { PhoneNumber } from "../../components/phone-number";
import { OutboundLink } from "../../../ui/outbound-link";
import ResponsiveElement from "../../components/responsive-element";
import { logEvent } from "../../../analytics/util";
import { LetterChoice } from "../../../../../common-data/la-letter-builder-letter-choices";

function getCategory(issue: LaIssueChoice): LaIssueCategoryChoice {
  return issue.split("__")[0] as LaIssueCategoryChoice;
}

export function getIssue(issue: LaIssueChoice) {
  return issue.split("__")[1];
}

export function getRoom(issue: LaIssueChoice): LaIssueRoomChoice {
  return issue.split("__")[2] as LaIssueRoomChoice;
}

function laIssueChoicesForCategory(
  category: LaIssueCategoryChoice
): [LaIssueChoice, string][] {
  const labels = getLaIssueChoiceLabels();
  // We only want to show one of each issue type (e.g. Mold) as dropdown labels.
  function dedupByIssue(array: LaIssueChoice[]) {
    var mySet = new Set();
    return array.filter(function (choice) {
      var key = getIssue(choice);
      var isNew = !mySet.has(key);
      if (isNew) mySet.add(key);
      return isNew;
    });
  }
  return dedupByIssue(LaIssueChoices)
    .filter((choice) => getCategory(choice) === category)
    .map((choice) => [choice as LaIssueChoice, labels[choice]]);
}

function laRoomChoicesForIssue(issue: string): DjangoChoices {
  const labels = getLaIssueRoomChoiceLabels();
  return LaIssueChoices.filter(
    (choice) => getIssue(choice) === issue
  ).map((choice) => [choice, labels[getRoom(choice)]]);
}

type LaIssuesPage = LaIssuesRoutesProps;

export const LaIssuesPage: React.FC<LaIssuesPage> = (props) => {
  const labels = getLaIssueCategoryChoiceLabels();

  const getInitialState = (session: AllSessionInfo) => ({
    laIssues: session.laIssues as LaIssueChoice[],
  });
  return (
    <Page title={li18n._(t`Select the repairs you need in your home`)}>
      <ResponsiveElement className="mb-5" desktop="h3" touch="h1">
        <Trans>Select the repairs you need in your home</Trans>
      </ResponsiveElement>
      <ResponsiveElement desktop="h4" touch="h3">
        <Trans>
          Start with the general area of repairs. You can follow up with your
          landlord or property manager in more detail once they receive your
          letter.
        </Trans>
      </ResponsiveElement>
      <div>
        <SessionUpdatingFormSubmitter
          confirmNavIfChanged
          mutation={LaLetterBuilderIssuesMutation}
          initialState={getInitialState}
          onSuccessRedirect={props.toNext}
        >
          {(ctx) => (
            <>
              {toDjangoChoices(LaIssueCategoryChoices, labels).map(
                ([category, categoryLabel], i) => (
                  <div className="jf-accordion-list-large mt-11" key={i}>
                    <h2 className="jf-laletterbuilder-issue-category pb-4 mb-5">
                      {categoryLabel}
                    </h2>
                    {laIssueChoicesForCategory(category).map(
                      ([issue, issueLabel], i) => {
                        const selectedIssues = ctx.fieldPropsFor("laIssues")
                          .value;
                        const choices = laRoomChoicesForIssue(getIssue(issue));
                        const count = choices.reduce(
                          (prev, current) =>
                            prev +
                            (selectedIssues.indexOf(current[0]) >= 0 ? 1 : 0),
                          0
                        );
                        const question = (
                          <>
                            <span>{issueLabel}</span>
                            {!!count && (
                              <span className="tag is-black">{`${count} selected`}</span>
                            )}
                          </>
                        );
                        return (
                          <Accordion
                            question={question}
                            key={i}
                            questionClassName=""
                          >
                            <MultiCheckboxFormField
                              {...ctx.fieldPropsFor("laIssues")}
                              label={""}
                              choices={choices}
                              onChange={(choices, selectedChoice, checked) => {
                                logEvent("latenants.issue.click", {
                                  letterType: "HABITABILITY" as LetterChoice,
                                  issueName: selectedChoice,
                                  isChecked: checked,
                                });
                                ctx.fieldPropsFor("laIssues").onChange(choices);
                              }}
                            />
                          </Accordion>
                        );
                      }
                    )}
                  </div>
                )
              )}
              <h2 className="mt-11">
                <Trans>Common questions</Trans>
              </h2>
              <Accordion
                question={li18n._(t`What if a repair I need is not listed?`)}
                extraClassName=""
                questionClassName="is-size-6 jf-has-text-underline"
              >
                <div className="content">
                  <Trans id="laletterbuilder.issues.repairNotListedv2">
                    The Notice of Repair letter will formally document your
                    request for repairs. If you have additional repair needs
                    beyond what is on this repair check list it is important to
                    maintain a proper paper trail. Only contact your landlord or
                    property management company through email, text messages, or
                    through certified mail. If you do decide to call your
                    landlord/ property manager we recommend emailing or texting
                    them details of the conversation afterwards.
                  </Trans>
                </div>
              </Accordion>
              <Accordion
                question={li18n._(
                  t`Where can I add more details about the issues in my home?`
                )}
                extraClassName=""
                questionClassName="is-size-6 jf-has-text-underline"
              >
                <div className="content">
                  <Trans id="laletterbuilder.issues.addRepairDetailsv2">
                    You can share more details with your landlord or property
                    management company through email, text messages, or through
                    certified mail. If the repair issue is urgent contact{" "}
                    <OutboundLink href="https://housing.lacity.org/residents/file-a-complaint">
                      LAHD
                    </OutboundLink>{" "}
                    at <PhoneNumber number="(866) 557-7368" />.
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
