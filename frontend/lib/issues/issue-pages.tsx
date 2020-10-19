import React from "react";
import classnames from "classnames";
import { allCapsToSlug, slugToAllCaps, toDjangoChoices } from "../common-data";
import Page from "../ui/page";
import { IssuesRouteInfo, IssuesRouteAreaProps } from "../justfix-routes";
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
import { MultiCheckboxFormField, HiddenFormField } from "../forms/form-fields";
import { NextButton, BackButton, ProgressButtons } from "../ui/buttons";
import { AllSessionInfo } from "../queries/AllSessionInfo";
import {
  issueChoicesForArea,
  issuesForArea,
  areaIssueCount,
  customIssuesForArea,
} from "./issues";
import ISSUE_AREA_SVGS from "../svg/issues";
import { assertNotUndefined } from "../util/util";
import {
  IssueAreaChoice,
  isIssueAreaChoice,
  getIssueAreaChoiceLabels,
  IssueAreaChoices,
} from "../../../common-data/issue-area-choices";
import { IssueChoice } from "../../../common-data/issue-choices";
import issueConsts from "../../../common-data/issue-validation.json";
import { FormContext } from "../forms/form-context";
import { Formset } from "../forms/formset";
import { FormsetItem, formsetItemProps } from "../forms/formset-item";
import { TextualFieldWithCharsRemaining } from "../forms/chars-remaining";
import { Modal } from "../ui/modal";
import { UpdateBrowserStorage, useBrowserStorage } from "../browser-storage";
import { NoScriptFallback } from "../ui/progressive-enhancement";
import { getQuerystringVar } from "../util/querystring";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

const checkSvg = require("../svg/check-solid.svg") as JSX.Element;

// https://github.com/lingui/js-lingui/issues/514
const { CUSTOM_ISSUE_MAX_LENGTH, MAX_CUSTOM_ISSUES_PER_AREA } = issueConsts;

type IssuesAreaPropsWithCtx = IssuesRouteAreaProps & {
  toHome: string;
};

export class IssuesArea extends React.Component<IssuesAreaPropsWithCtx> {
  @autobind
  renderForm(
    ctx: FormContext<IssueAreaV2Input>,
    area: IssueAreaChoice
  ): JSX.Element {
    return (
      <React.Fragment>
        <HiddenFormField {...ctx.fieldPropsFor("area")} />
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor("issues")}
          label={li18n._(t`Select your issues`)}
          choices={issueChoicesForArea(area)}
        />
        <br />
        <p>
          <Trans>
            Don't see your issues listed? You can add up to{" "}
            {MAX_CUSTOM_ISSUES_PER_AREA} additional issues below.
          </Trans>
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
                label={
                  li18n._(t`Custom issue #`) + (i + 1) + li18n._(t`(optional)`)
                }
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
        <BackButton
          to={this.props.toHome}
          label={li18n._(t`Cancel and go back`)}
        />
        <NextButton isLoading={isLoading} label={li18n._(t`Save`)} />
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
      <Page title={`${label} - ` + li18n._(t`Issue checklist`)}>
        <div>
          <h1 className="title is-4 jf-issue-area">
            {svg} {label} <Trans>issues</Trans>
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
    ? li18n._(t`No issues reported`)
    : count === 1
    ? li18n._(t`One issue reported`)
    : li18n._(t`${count} issues reported`);
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
        const actionLabel =
          count === 0
            ? li18n._(t`Add issues`)
            : li18n._(t`Add or remove issues`);
        const title = `${actionLabel}: ${label}`;
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
              <Trans>Next</Trans>
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
      <strong className="has-text-danger">
        <Trans>Warning:</Trans>
      </strong>
      <Trans>
        Please be aware that letting a repair-worker into your home to make
        repairs may increase exposure to the COVID-19 virus.
      </Trans>
    </p>
    <p>
      <Trans id="justfix.CovidRecForEmergencyRepairsOnly">
        In order to follow social distancing guidelines and to limit exposure,
        we recommend only asking for repairs{" "}
        <strong>in the case of an emergency</strong> such as if you have no
        heat, no hot water, or no gas.
      </Trans>
    </p>
  </>
);

function CovidRiskModal(props: { routes: IssuesRouteInfo }): JSX.Element {
  return (
    <Modal
      title={li18n._(t`Social distancing and repairs`)}
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
              <Trans>I understand the risk</Trans>
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
        <Trans>
          This <strong>issue checklist</strong> will be sent to your landlord.
        </Trans>
      </>
    );
    return (
      <Page title={li18n._(t`Home self-inspection`)}>
        <div>
          <h1 className="title is-4 is-spaced">
            <Trans>Home self-inspection</Trans>
          </h1>
          <p className="subtitle is-6">
            <Trans>
              Please go room-by-room and select all of the issues that you are
              experiencing. {introContent}{" "}
              <strong>Make sure to be thorough.</strong>
            </Trans>
          </p>
          <NoScriptFallback>
            <>
              {" "}
              <CovidRiskMessage /> <br />{" "}
            </>
          </NoScriptFallback>
          {groupByTwo(toDjangoChoices(IssueAreaChoices, labels)).map(
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
              <Trans>Back</Trans>
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
};

export function IssuesRoutes(props: IssuesRoutesProps): JSX.Element {
  const { routes } = props;
  return (
    <Switch>
      <Route
        path={routes.home}
        exact
        render={() => <IssuesHome {...props} />}
      />
      <Route
        path={routes.modal}
        exact
        render={() => <IssuesHome {...props} withModal={true} />}
      />
      <Route
        path={routes.area.parameterizedRoute}
        render={(ctx) => <IssuesArea {...ctx} toHome={routes.home} />}
      />
    </Switch>
  );
}
