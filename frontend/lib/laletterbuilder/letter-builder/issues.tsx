import React from "react";
import { DjangoChoices, toDjangoChoices } from "../../common-data";
import Page from "../../ui/page";
import { Switch, Route } from "react-router";
import { Link } from "react-router-dom";
import { ProgressButtons } from "../../ui/buttons";
import { Accordion } from "../../ui/accordion";
import {
  getLaIssueCategoryChoiceLabels,
  LaIssueCategoryChoice,
  LaIssueCategoryChoices,
} from "../../../../common-data/issue-category-choices-laletterbuilder";
import {
  getLaIssueRoomChoiceLabels,
  LaIssueRoomChoice,
  LaIssueRoomChoices,
} from "../../../../common-data/issue-room-choices-laletterbuilder";
import { IssuesRouteInfo } from "../../issues/route-info";
import {
  getLaIssueChoiceLabels,
  LaIssueChoice,
  LaIssueChoices,
} from "../../../../common-data/issue-choices-laletterbuilder";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { MultiCheckboxFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { IssuesLinkToNextStep } from "../../issues/routes";
import { IssueAreaV2Mutation } from "../../queries/IssueAreaV2Mutation";
import { AllSessionInfo } from "../../queries/AllSessionInfo";

type LaIssueName = "MOLD" | "PEELING_PAINT";

function laIssueCategory(issue: LaIssueChoice): LaIssueCategoryChoice {
  return issue.split("__")[0] as LaIssueCategoryChoice;
}

function laIssue(issue: LaIssueChoice): LaIssueName {
  return issue.split("__")[1] as LaIssueName;
}

function laIssueRoom(issue: LaIssueChoice): LaIssueRoomChoice {
  return issue.split("__")[2] as LaIssueRoomChoice;
}

function laIssueChoicesForCategory(
  category: LaIssueCategoryChoice
): DjangoChoices {
  const labels = getLaIssueChoiceLabels();
  return LaIssueChoices.filter(
    (choice) => laIssueCategory(choice) === category
  ).map((choice) => [choice, labels[choice]] as [string, string]);
}

function laRoomChoicesForIssue(issue: string): DjangoChoices {
  const labels = getLaIssueRoomChoiceLabels();
  return LaIssueChoices.filter((choice) => laIssue(choice) === issue).map(
    (choice) => [choice, labels[laIssueRoom(choice)]] as [string, string]
  );
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
          mutation={IssueAreaV2Mutation}
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
                            choices={laRoomChoicesForIssue(issue)}
                          />
                          {/** 
                    {LaIssueRoomChoices.map((issueLocation, i) => (
                      // TODO: Replace this checkbox with a form field that will save the result to the session!
                      <label className="checkbox jf-checkbox" key={i}>
                        <input
                          type="checkbox"
                          name="issues"
                          id={`issues_${issueLocation}`}
                          aria-invalid="false"
                          value={issueLocation}
                        />{" "}
                        <span className="jf-checkbox-symbol"></span>{" "}
                        <span className="jf-label-text">
                          {getLaIssueRoomChoiceLabels()[issueLocation]}
                        </span>
                      </label>
                    ))}
                    */}
                        </Accordion>
                      )
                    )}
                    <br />
                  </div>
                )
              )}
              <br />
              <ProgressButtons>
                <Link to={props.toBack} className="button is-light is-medium">
                  Back
                </Link>
                <IssuesLinkToNextStep toNext={props.toNext} />
              </ProgressButtons>
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
