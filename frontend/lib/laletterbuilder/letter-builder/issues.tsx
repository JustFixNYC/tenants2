import React from "react";
import {
  allCapsToSlug,
  DjangoChoices,
  slugToAllCaps,
  toDjangoChoices,
} from "../../common-data";
import Page from "../../ui/page";
import { Switch, Route } from "react-router";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { ProgressButtons } from "../../ui/buttons";
import {
  IssueAreaChoice,
  isIssueAreaChoice,
} from "../../../../common-data/issue-area-choices";
import { Modal } from "../../ui/modal";
import { UpdateBrowserStorage } from "../../browser-storage";
import { NoScriptFallback } from "../../ui/progressive-enhancement";
import { getQuerystringVar } from "../../util/querystring";
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

function laIssueArea(issue: LaIssueChoice): LaIssueAreaChoice {
  return issue.split("__")[0] as LaIssueAreaChoice;
}

function laIssueChoicesForArea(area: LaIssueAreaChoice): DjangoChoices {
  const labels = getLaIssueChoiceLabels();
  return LaIssueChoices.filter((choice) => laIssueArea(choice) === area).map(
    (choice) => [choice, labels[choice]] as [string, string]
  );
}

function LinkToNextStep(props: { toNext: string }): JSX.Element {
  return (
    <AppContext.Consumer>
      {(ctx) => {
        if (ctx.session.issues.length || ctx.session.customIssuesV2?.length) {
          return (
            <Link to={props.toNext} className="button is-primary is-medium">
              Next
            </Link>
          );
        } else {
          return null;
        }
      }}
    </AppContext.Consumer>
  );
}

type IssuesHomeProps = IssuesRoutesProps;

const CovidRiskMessage = () => (
  <>
    <p>
      <strong className="has-text-danger">Warning: </strong>
      Please be aware that letting a repair-worker into your home to make
      repairs may increase exposure to the COVID-19 virus.
    </p>
    <p>
      In order to follow social distancing guidelines and to limit exposure, we
      recommend only asking for repairs{" "}
      <strong>in the case of an emergency</strong> such as if you have no heat,
      no hot water, or no gas.
    </p>
  </>
);

function CovidRiskModal(props: { routes: IssuesRouteInfo }): JSX.Element {
  return (
    <Modal
      title="Social distancing and repairs"
      withHeading
      onCloseGoTo={(loc) => {
        const slug = getQuerystringVar(loc.search, "area") || "";
        let area = slugToAllCaps(slug) as IssueAreaChoice;
        if (!isIssueAreaChoice(area)) {
          area = "HOME";
        }
        const url = props.routes.area.create(allCapsToSlug(area));
        return url;
      }}
      render={(ctx) => (
        <>
          <CovidRiskMessage />
          <div className="has-text-centered">
            <Link
              className={`button is-primary is-medium is-danger`}
              {...ctx.getLinkCloseProps()}
            >
              I understand the risk
            </Link>
          </div>
          <UpdateBrowserStorage hasViewedCovidRiskModal={true} />
        </>
      )}
    />
  );
}

class IssuesHome extends React.Component<IssuesHomeProps> {
  constructor(props: IssuesHomeProps) {
    super(props);
    this.state = { searchText: "" };
  }

  render() {
    const labels = getLaIssueAreaChoiceLabels();
    const introContent = this.props.introContent || (
      <>
        This <strong>issue checklist</strong> will be sent to your landlord.
      </>
    );

    return (
      <Page title="Home self-inspection" withHeading>
        <div>
          <p className="subtitle is-6">
            Please go room-by-room and select all of the issues that you are
            experiencing. {introContent}{" "}
            <strong>Make sure to be thorough.</strong>
          </p>
          <NoScriptFallback>
            <>
              {" "}
              <CovidRiskMessage /> <br />{" "}
            </>
          </NoScriptFallback>
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
        {this.props.withModal && <CovidRiskModal routes={this.props.routes} />}
      </Page>
    );
  }
}

type IssuesRoutesProps = {
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

export function IssuesRoutes(props: IssuesRoutesProps): JSX.Element {
  const { routes, useListStyleIssueChecklist } = props;
  return (
    <Switch>
      <Route
        path={routes.home}
        exact
        render={() => <IssuesHome {...props} />}
        useListStyleIssueChecklist={useListStyleIssueChecklist}
      />
      <Route
        path={routes.modal}
        exact
        render={() => <IssuesHome {...props} withModal={true} />}
      />
    </Switch>
  );
}
