import React from "react";
import classnames from "classnames";
import {
  allCapsToSlug,
  DjangoChoice,
  DjangoChoices,
  ReactDjangoChoice,
  slugToAllCaps,
  toDjangoChoices,
} from "../common-data";
import Page from "../ui/page";
import { IssuesRouteInfo, IssuesRouteAreaProps } from "./route-info";
import { Switch, Route } from "react-router";
import { Link } from "react-router-dom";
import { NotFound } from "../pages/not-found";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { IssueAreaV2Input } from "../queries/globalTypes";
import {
  IssueAreaV2Mutation,
  BlankCustomIssuesCustomIssueFormFormSetInput,
} from "../queries/IssueAreaV2Mutation";
import autobind from "autobind-decorator";
import { AppContext } from "../app-context";
import {
  MultiCheckboxFormField,
  HiddenFormField,
  MultiChoiceFormFieldItem,
} from "../forms/form-fields";
import { NextButton, BackButton, ProgressButtons } from "../ui/buttons";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import {
  issueChoicesForArea,
  issuesForArea,
  areaIssueCount,
  customIssuesForArea,
} from "./issues";
import ISSUE_AREA_SVGS from "../svg/issues";
import { assertNotUndefined } from "@justfixnyc/util";
import {
  IssueAreaChoice,
  isIssueAreaChoice,
  getIssueAreaChoiceLabels,
  IssueAreaChoices,
} from "../../../common-data/issue-area-choices";
import { IssueChoice } from "../../../common-data/issue-choices";
import {
  CUSTOM_ISSUE_MAX_LENGTH,
  MAX_CUSTOM_ISSUES_PER_AREA,
} from "../../../common-data/issue-validation";
import { FormContext } from "../forms/form-context";
import { Formset } from "../forms/formset";
import { FormsetItem, formsetItemProps } from "../forms/formset-item";
import { TextualFieldWithCharsRemaining } from "../forms/chars-remaining";
import { Modal } from "../ui/modal";
import { UpdateBrowserStorage, useBrowserStorage } from "../browser-storage";
import { NoScriptFallback } from "../ui/progressive-enhancement";
import { getQuerystringVar } from "../util/querystring";
import { Accordion } from "../ui/accordion";

const checkSvg = require("../svg/check-solid.svg") as JSX.Element;

type IssuesAreaPropsWithCtx = IssuesRouteAreaProps & {
  toHome: string;
};

/**
 * Category headings that will appear immediately above
 * certain issues.
 */
const CATEGORY_HEADINGS: Map<IssueChoice, string> = new Map([
  ["BATHROOMS__MOLD", "General"],
  ["BATHROOMS__SINK", "Sink"],
  ["BATHROOMS__TUB", "Bathtub"],
  ["BATHROOMS__SHOWER_MOLD", "Shower"],
]);

const CATEGORY_HEADING_CLASS = "title is-6 jf-issue-category-heading";

/**
 * If a choice's label is of the form `<Category>: <Problem>`, e.g.
 * `Sink: Leaky faucet`, this removes the category for non-screen-reader
 * users, with the assumption that a category heading will be above
 * the issue to indicate such context visually.
 */
function decategorize(choice: DjangoChoice): ReactDjangoChoice {
  const [value, label] = choice;
  const match = label.match(/^(.+): (.+)$/);
  if (!match) {
    return choice;
  }
  const category = match[1];
  const problem = match[2][0].toUpperCase() + match[2].slice(1);
  return [
    value,
    <>
      <span className="jf-sr-only">{category}: </span>
      {problem}
    </>,
  ];
}

/**
 * Interleave the given choices with category headings, if we
 * have any.
 */
function categorizeChoices(choices: DjangoChoices): MultiChoiceFormFieldItem[] {
  const result: MultiChoiceFormFieldItem[] = [];

  for (let [choice, label] of choices) {
    const heading = CATEGORY_HEADINGS.get(choice as any);
    if (heading) {
      result.push(
        <div
          className={CATEGORY_HEADING_CLASS}
          key={`before_${choice}_heading`}
        >
          {heading}
        </div>
      );
    }
    result.push(decategorize([choice, label]));
  }

  return result;
}

export class IssuesArea extends React.Component<IssuesAreaPropsWithCtx> {
  @autobind
  renderForm(
    ctx: FormContext<IssueAreaV2Input>,
    area: IssueAreaChoice
  ): JSX.Element {
    const choices = categorizeChoices(issueChoicesForArea(area));
    const hasSubsections = choices.some((c) => !Array.isArray(c));
    let label = "Select your issues";

    if (hasSubsections) {
      label = "";
    }

    return (
      <React.Fragment>
        <HiddenFormField {...ctx.fieldPropsFor("area")} />
        {hasSubsections && <p>Select your issues.</p>}
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor("issues")}
          label={label}
          choices={choices}
        />
        <br />
        <p>
          Don't see your issues listed? You can add up to{" "}
          {MAX_CUSTOM_ISSUES_PER_AREA} additional issues below.
        </p>
        <br />
        <Formset
          {...ctx.formsetPropsFor("customIssues")}
          maxNum={MAX_CUSTOM_ISSUES_PER_AREA}
          extra={MAX_CUSTOM_ISSUES_PER_AREA}
          emptyForm={BlankCustomIssuesCustomIssueFormFormSetInput}
        >
          {(ciCtx, i) => (
            <FormsetItem {...formsetItemProps(ciCtx)}>
              <TextualFieldWithCharsRemaining
                {...ciCtx.fieldPropsFor("description")}
                maxLength={CUSTOM_ISSUE_MAX_LENGTH}
                fieldProps={{
                  style: { maxWidth: `${CUSTOM_ISSUE_MAX_LENGTH}em` },
                }}
                label={`Custom issue #${i + 1} (optional)`}
              />
            </FormsetItem>
          )}
        </Formset>
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <ProgressButtons>
        <BackButton to={this.props.toHome} label="Cancel and go back" />
        <NextButton isLoading={isLoading} label="Save" />
      </ProgressButtons>
    );
  }

  render() {
    const area = slugToAllCaps(this.props.match.params.area);
    if (!isIssueAreaChoice(area)) {
      return <NotFound {...this.props} />;
    }
    const label = getIssueAreaChoiceLabels()[area];
    const getInitialState = (session: AllSessionInfo): IssueAreaV2Input => ({
      area,
      issues: issuesForArea(area, session.issues as IssueChoice[]),
      customIssues: customIssuesForArea(area, session.customIssuesV2 || []).map(
        (ci) => ({
          description: ci.description,
          id: ci.id,
          DELETE: false,
        })
      ),
    });
    const svg = assertNotUndefined(ISSUE_AREA_SVGS[area]);
    return (
      <Page title={`${label} - Issue checklist`}>
        <div>
          <h1 className="title is-4 jf-issue-area">
            {svg} {label} issues
          </h1>
          <SessionUpdatingFormSubmitter
            confirmNavIfChanged
            mutation={IssueAreaV2Mutation}
            initialState={getInitialState}
            onSuccessRedirect={this.props.toHome}
          >
            {(formCtx) => this.renderForm(formCtx, area)}
          </SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  }
}

export function getIssueLabel(count: number): string {
  return count === 0
    ? "No issues reported"
    : count === 1
    ? "One issue reported"
    : `${count} issues reported`;
}

type IssueAreaLinkProps = {
  area: IssueAreaChoice;
  label: string;
  routes: IssuesRouteInfo;
};

function IssueAreaLink(props: IssueAreaLinkProps): JSX.Element {
  const { area, label } = props;
  const [{ hasViewedCovidRiskModal }] = useBrowserStorage();

  return (
    <AppContext.Consumer>
      {(ctx) => {
        const count = areaIssueCount(
          area,
          ctx.session.issues as IssueChoice[],
          ctx.session.customIssuesV2 || []
        );
        const url = props.routes.area.create(allCapsToSlug(area));
        const modalUrl = props.routes.modal;
        const actionLabel = count === 0 ? "Add issues" : "Add or remove issues";
        const title = `${actionLabel} for ${label}`;
        const issueLabel = getIssueLabel(count);
        const ariaLabel = `${title} (${issueLabel})`;
        const svg = assertNotUndefined(ISSUE_AREA_SVGS[area]);
        const inSafeMode = ctx.session.isSafeModeEnabled;

        return (
          <Link
            to={
              !hasViewedCovidRiskModal && !inSafeMode
                ? modalUrl + "?area=" + allCapsToSlug(area)
                : url
            }
            className={classnames(
              "jf-issue-area-link",
              "notification",
              count === 0 && "jf-issue-count-zero"
            )}
            title={title}
            aria-label={ariaLabel}
          >
            {svg}
            <p className="title is-5 is-spaced">{label}</p>
            <p className="subtitle is-6 jf-issue-count">
              {checkSvg} {issueLabel}
            </p>
          </Link>
        );
      }}
    </AppContext.Consumer>
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

/**
 * "Chunk" an array into groups of two so that they can
 * be added into a two-column Bulma layout.
 */
export function groupByTwo<T>(arr: T[]): [T, T | null][] {
  const result: [T, T | null][] = [];
  let prev: T | null = null;

  for (let curr of arr) {
    if (prev) {
      result.push([prev, curr]);
      prev = null;
    } else {
      prev = curr;
    }
  }

  if (prev) {
    result.push([prev, null]);
  }

  return result;
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

  renderColumnForArea(area: IssueAreaChoice, label: string): JSX.Element {
    return (
      <div className="column">
        <IssueAreaLink routes={this.props.routes} area={area} label={label} />
      </div>
    );
  }

  render() {
    const labels = getIssueAreaChoiceLabels();
    const introContent = this.props.introContent || (
      <>
        This <strong>issue checklist</strong> will be sent to your landlord.
      </>
    );
    const useListStyle = this.props.useListStyleIssueChecklist;
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
          {useListStyle
            ? toDjangoChoices(IssueAreaChoices, labels).map(
                ([area, areaLabel], i) => (
                  <div className="jf-laletterbuilder-issues-list" key={i}>
                    <p>{areaLabel}</p>
                    {issueChoicesForArea(area).map(([issue, issueLabel], i) => (
                      <Accordion
                        question={issueLabel}
                        key={i}
                        questionClassName="has-text-primary"
                        textLabelsForToggle={["Open", "Close"]}
                      >
                        {IssueAreaChoices.map((issueLocation, i) => (
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
                              {getIssueAreaChoiceLabels()[issueLocation]}
                            </span>
                          </label>
                        ))}
                      </Accordion>
                    ))}
                    <br />
                  </div>
                )
              )
            : groupByTwo(toDjangoChoices(IssueAreaChoices, labels)).map(
                ([a, b], i) => (
                  <div className="columns is-tablet" key={i}>
                    {this.renderColumnForArea(...a)}
                    {b && this.renderColumnForArea(...b)}
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
      {!useListStyleIssueChecklist && (
        <Route
          path={routes.area.parameterizedRoute}
          render={(ctx) => <IssuesArea {...ctx} toHome={routes.home} />}
        />
      )}
    </Switch>
  );
}
