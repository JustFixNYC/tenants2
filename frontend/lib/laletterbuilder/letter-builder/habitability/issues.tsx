import React from "react";
import { DjangoChoices, toDjangoChoices } from "../../../common-data";
import Page from "../../../ui/page";
import { Switch, Route } from "react-router";
import { Link } from "react-router-dom";
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
  LaIssueRoomChoices,
} from "../../../../../common-data/issue-room-choices-laletterbuilder";
import { IssuesRouteInfo } from "../../../issues/route-info";
import {
  getLaIssueChoiceLabels,
  LaIssueChoice,
  LaIssueChoices,
} from "../../../../../common-data/issue-choices-laletterbuilder";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../../i18n-lingui";
import { MultiCheckboxFormField } from "../../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../../forms/session-updating-form-submitter";
import { AllSessionInfo } from "../../../queries/AllSessionInfo";
import { LaLetterBuilderIssuesMutation } from "../../../queries/LaLetterBuilderIssuesMutation";

type LaIssueName = "MOLD" | "PEELING_PAINT";

function getCategory(issue: LaIssueChoice): LaIssueCategoryChoice {
  return issue.split("__")[0] as LaIssueCategoryChoice;
}

function getIssue(issue: LaIssueChoice): LaIssueName {
  return issue.split("__")[1] as LaIssueName;
}

function getRoom(issue: LaIssueChoice): LaIssueRoomChoice {
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

const LaIssuesPage: React.FC<LaIssuesPage> = (props) => {
  const labels = getLaIssueCategoryChoiceLabels();

  const getInitialState = (session: AllSessionInfo) => ({
    issues: session.issues as LaIssueChoice[],
  });
  return (
    <Page title={li18n._(t`Select which repairs are needed`)} withHeading>
      <br />
      <div>
        <SessionUpdatingFormSubmitter
          confirmNavIfChanged
          mutation={LaLetterBuilderIssuesMutation}
          initialState={getInitialState}
        >
          {(ctx) => (
            <>
              {toDjangoChoices(LaIssueCategoryChoices, labels).map(
                ([category, categoryLabel], i) => (
                  <div className="jf-laletterbuilder-issues-list" key={i}>
                    <p>{categoryLabel}</p>
                    {laIssueChoicesForCategory(category).map(
                      ([issue, issueLabel], i) => (
                        <Accordion
                          question={issueLabel}
                          key={i}
                          questionClassName="has-text-primary"
                          textLabelsForToggle={[
                            li18n._(t`Open`),
                            li18n._(t`Close`),
                          ]}
                        >
                          <MultiCheckboxFormField
                            {...ctx.fieldPropsFor("issues")}
                            label={""}
                            choices={laRoomChoicesForIssue(getIssue(issue))}
                          />
                        </Accordion>
                      )
                    )}
                    <br />
                  </div>
                )
              )}
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
  routes: IssuesRouteInfo;
  introContent?: string | JSX.Element;
  toBack: string;
  toNext: string;
  withModal?: boolean;
};

export function LaIssuesRoutes(props: LaIssuesRoutesProps): JSX.Element {
  const { routes } = props;
  return (
    <Switch>
      <Route
        path={routes.home}
        exact
        render={() => <LaIssuesPage {...props} />}
      />
      <Route
        path={routes.modal}
        exact
        render={() => <LaIssuesPage {...props} withModal={true} />}
      />
    </Switch>
  );
}
