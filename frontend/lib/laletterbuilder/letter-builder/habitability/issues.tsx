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
    <Page
      title={li18n._(t`Select the repairs you need in your home`)}
      withHeading
    >
      <p>
        <Trans>
          All you need for now are the basics. You can follow up with your
          landlord or property manager in more detail once they receive your
          letter.
        </Trans>
      </p>
      <br />
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
                  <div className="jf-accordion-list-large" key={i}>
                    <h2>{categoryLabel}</h2>
                    <br />
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
                            questionClassName="has-text-primary"
                          >
                            <MultiCheckboxFormField
                              {...ctx.fieldPropsFor("laIssues")}
                              label={""}
                              choices={choices}
                            />
                          </Accordion>
                        );
                      }
                    )}
                  </div>
                )
              )}
              <Accordion
                question={li18n._(t`What if a repair I need is not listed?`)}
                extraClassName=""
              >
                <div className="content">
                  <Trans id="laletterbuilder.issues.repairNotListed">
                    The Notice to Repair letter will formally document your
                    request for repairs. Once you arrange access dates that work
                    for everyone, you can inform the landlord or property
                    manager about any other repairs you need.
                  </Trans>
                </div>
              </Accordion>
              <Accordion
                question={li18n._(
                  t`Where can I add more details about the issues in my home?`
                )}
                extraClassName=""
              >
                <div className="content">
                  <Trans id="laletterbuilder.issues.addRepairDetails">
                    You can share more details with your landlord if they
                    respond, or with{" "}
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
