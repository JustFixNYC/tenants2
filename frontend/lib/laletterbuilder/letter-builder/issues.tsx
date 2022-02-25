import React from "react";
import { DjangoChoices, toDjangoChoices } from "../../common-data";
import Page from "../../ui/page";
import { Switch, Route } from "react-router";
import { Link } from "react-router-dom";
import { ProgressButtons } from "../../ui/buttons";
import { Accordion } from "../../ui/accordion";
import {
  getLaIssueAreaChoiceLabels,
  LaIssueAreaChoice,
  LaIssueAreaChoices,
} from "../../../../common-data/issue-area-choices-laletterbuilder";
import {
  getLaIssueRoomChoiceLabels,
  LaIssueRoomChoices,
} from "../../../../common-data/issue-room-choices-laletterbuilder";
import { IssuesRouteInfo } from "../../issues/route-info";
import {
  getLaIssueChoiceLabels,
  LaIssueChoice,
  LaIssueChoices,
} from "../../../../common-data/issue-choices-laletterbuilder";
import { LinkToNextStep } from "../../issues/routes";

function laIssueArea(issue: LaIssueChoice): LaIssueAreaChoice {
  return issue.split("__")[0] as LaIssueAreaChoice;
}

function laIssueChoicesForArea(area: LaIssueAreaChoice): DjangoChoices {
  const labels = getLaIssueChoiceLabels();
  return LaIssueChoices.filter((choice) => laIssueArea(choice) === area).map(
    (choice) => [choice, labels[choice]] as [string, string]
  );
}

type LaIssuesHomeProps = LaIssuesRoutesProps;

class LaIssuesHome extends React.Component<LaIssuesHomeProps> {
  constructor(props: LaIssuesHomeProps) {
    super(props);
    this.state = { searchText: "" };
  }

  render() {
    const labels = getLaIssueAreaChoiceLabels();
    return (
      <Page title="Select which repairs are needed" withHeading>
        <br />
        <div>
          {toDjangoChoices(LaIssueAreaChoices, labels).map(
            ([area, areaLabel], i) => (
              <div className="jf-laletterbuilder-issues-list" key={i}>
                <p>{areaLabel}</p>
                {laIssueChoicesForArea(area).map(([issue, issueLabel], i) => (
                  <Accordion
                    question={issueLabel}
                    key={i}
                    questionClassName="has-text-primary"
                    textLabelsForToggle={["Open", "Close"]}
                  >
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
                  </Accordion>
                ))}
                <br />
              </div>
            )
          )}
          <br />
          <ProgressButtons>
            <Link to={this.props.toBack} className="button is-light is-medium">
              Back
            </Link>
            <LinkToNextStep toNext={this.props.toNext} />
          </ProgressButtons>
        </div>
      </Page>
    );
  }
}

type LaIssuesRoutesProps = {
  routes: IssuesRouteInfo;
  introContent?: string | JSX.Element;
  toBack: string;
  toNext: string;
  withModal?: boolean;
  /**
   * If true, issue list will show as one large list of checkboxes, with accordian
   * dropdowns for each sub-category of issues.
   *
   * If false or undefined, issue list will use the default structure where the
   * user selects an area box from a grid to start marking issues.
   */
  useListStyleIssueChecklist?: boolean;
};

export function LaIssuesRoutes(props: LaIssuesRoutesProps): JSX.Element {
  const { routes, useListStyleIssueChecklist } = props;
  return (
    <Switch>
      <Route
        path={routes.home}
        exact
        render={() => <LaIssuesHome {...props} />}
        useListStyleIssueChecklist={useListStyleIssueChecklist}
      />
      <Route
        path={routes.modal}
        exact
        render={() => <LaIssuesHome {...props} withModal={true} />}
      />
    </Switch>
  );
}
