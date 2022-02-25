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
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";

function laIssueArea(issue: LaIssueChoice): LaIssueAreaChoice {
  return issue.split("__")[0] as LaIssueAreaChoice;
}

function laIssueChoicesForArea(area: LaIssueAreaChoice): DjangoChoices {
  const labels = getLaIssueChoiceLabels();
  return LaIssueChoices.filter((choice) => laIssueArea(choice) === area).map(
    (choice) => [choice, labels[choice]] as [string, string]
  );
}

type LaIssuesPage = LaIssuesRoutesProps;

const LaIssuesPage: React.FC<LaIssuesPage> = (props) => {
  const labels = getLaIssueAreaChoiceLabels();
  return (
    <Page title={li18n._(t`Select which repairs are needed`)} withHeading>
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
                  textLabelsForToggle={[li18n._(t`Open`), li18n._(t`Close`)]}
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
          <Link to={props.toBack} className="button is-light is-medium">
            <Trans>Back</Trans>
          </Link>
          <Link
            to={props.toNext}
            className="button jf-is-next-button is-primary is-medium"
          >
            <Trans>Next</Trans>
          </Link>
          {/* TODO: Once the form submission is implemented above, 
            we may be able to use this component for the next step button, which
            becomes visible only when 1 or more issues are recorded in the session:

            <IssuesLinkToNextStep toNext={this.props.toNext} /> 

            */}
        </ProgressButtons>
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
