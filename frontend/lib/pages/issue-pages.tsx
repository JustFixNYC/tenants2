import React from 'react';
import classnames from 'classnames';
import { allCapsToSlug, slugToAllCaps, toDjangoChoices } from "../common-data";
import Page from '../page';
import { IssuesRouteInfo, IssuesRouteAreaProps } from '../routes';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { NotFound } from './not-found';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import { IssueAreaV2Input } from '../queries/globalTypes';
import { IssueAreaV2Mutation, BlankCustomIssuesCustomIssueFormFormSetInput } from '../queries/IssueAreaV2Mutation';
import autobind from 'autobind-decorator';
import { AppContext } from '../app-context';
import { MultiCheckboxFormField, HiddenFormField, TextualFormField } from '../form-fields';
import { NextButton, BackButton, ProgressButtons } from "../buttons";
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { issueChoicesForArea, issuesForArea, areaIssueCount, customIssuesForArea } from '../issues';
import ISSUE_AREA_SVGS from '../svg/issues';
import { assertNotUndefined } from '../util';
import { IssueAreaChoice, isIssueAreaChoice, getIssueAreaChoiceLabels, IssueAreaChoices } from '../../../common-data/issue-area-choices';
import { IssueChoice } from '../../../common-data/issue-choices';
import { CUSTOM_ISSUE_MAX_LENGTH, MAX_CUSTOM_ISSUES_PER_AREA } from '../../../common-data/issue-validation.json';
import { FormContext } from '../form-context';
import { Formset } from '../formset';
import { FormsetItem, formsetItemProps } from '../formset-item';

const checkSvg = require('../svg/check-solid.svg') as JSX.Element;

type IssuesAreaPropsWithCtx = IssuesRouteAreaProps & {
  toHome: string
};

export class IssuesArea extends React.Component<IssuesAreaPropsWithCtx> {
  @autobind
  renderForm(ctx: FormContext<IssueAreaV2Input>, area: IssueAreaChoice): JSX.Element {
    return (
      <React.Fragment>
        <HiddenFormField {...ctx.fieldPropsFor('area')} />
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor('issues')}
          label="Select your issues"
          choices={issueChoicesForArea(area)}
        />
        <p>Don't see your issues listed? You can add up to {MAX_CUSTOM_ISSUES_PER_AREA} additional issues below.</p>
        <br/>
        <Formset {...ctx.formsetPropsFor('customIssues')}
                 maxNum={5}
                 extra={5}
                 emptyForm={BlankCustomIssuesCustomIssueFormFormSetInput}>
          {(ciCtx, i) =>
            <FormsetItem {...formsetItemProps(ciCtx)}>
              <TextualFormField {...ciCtx.fieldPropsFor('description')} label={`Custom issue #${i + 1} (optional, ${CUSTOM_ISSUE_MAX_LENGTH} characters max)`} />
            </FormsetItem>
          }
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
      customIssues: customIssuesForArea(area, session.customIssuesV2 || []).map(ci => ({
        description: ci.description,
        id: ci.id,
        DELETE: false,
      })),
    });
    const svg = assertNotUndefined(ISSUE_AREA_SVGS[area]);
    return (
      <Page title={`${label} - Issue checklist`}>
        <div>
          <h1 className="title is-4 jf-issue-area">{svg} {label} issues</h1>
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
  return count === 0 ? 'No issues reported'
    : count === 1 ? 'One issue reported'
      : `${count} issues reported`;
}

type IssueAreaLinkProps = {
  area: IssueAreaChoice;
  label: string;
  routes: IssuesRouteInfo;
};

function IssueAreaLink(props: IssueAreaLinkProps): JSX.Element {
  const { area, label } = props;

  return (
    <AppContext.Consumer>
      {(ctx) => {
        const count = areaIssueCount(area, ctx.session.issues as IssueChoice[], ctx.session.customIssuesV2 || []);
        const url = props.routes.area.create(allCapsToSlug(area));
        const actionLabel = count === 0 ? 'Add issues' : 'Add or remove issues';
        const title = `${actionLabel} for ${label}`;
        const issueLabel = getIssueLabel(count);
        const ariaLabel = `${title} (${issueLabel})`;
        const svg = assertNotUndefined(ISSUE_AREA_SVGS[area]);

        return (
          <Link to={url} className={classnames(
            'jf-issue-area-link', 'notification',
            count === 0 && "jf-issue-count-zero"
          )} title={title} aria-label={ariaLabel}>
            {svg}
            <p className="title is-5 is-spaced">{label}</p>
            <p className="subtitle is-6 jf-issue-count">{checkSvg} {issueLabel}</p>
          </Link>
        );
      }}
    </AppContext.Consumer>
  );
}

function LinkToNextStep(props: {toNext: string}): JSX.Element {
  return (
    <AppContext.Consumer>
      {(ctx) => {
        if (ctx.session.issues.length || ctx.session.customIssues.length) {
          return <Link to={props.toNext} className="button is-primary is-medium">Next</Link>
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
export function groupByTwo<T>(arr: T[]): [T, T|null][] {
  const result: [T, T|null][] = [];
  let prev: T|null = null;

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

class IssuesHome extends React.Component<IssuesHomeProps> {
  constructor(props: IssuesHomeProps) {
    super(props);
    this.state = { searchText: '' };
  }

  renderColumnForArea(area: IssueAreaChoice, label: string): JSX.Element {
    return <div className="column">
      <IssueAreaLink
        routes={this.props.routes}
        area={area}
        label={label}
      />
    </div>;
  }

  render() {
    const labels = getIssueAreaChoiceLabels();
    const introContent = this.props.introContent || <>
      This <strong>issue checklist</strong> will be sent to your landlord.
    </>;
    return (
      <Page title="Apartment self-inspection">
        <div>
          <h1 className="title is-4 is-spaced">Apartment self-inspection</h1>
          <p className="subtitle is-6">Please go room-by-room and select all of the issues that you are experiencing. {introContent} <strong>Don't hold back!</strong></p>
          {groupByTwo(toDjangoChoices(IssueAreaChoices, labels)).map(([a, b], i) => (
            <div className="columns is-tablet" key={i}>
              {this.renderColumnForArea(...a)}
              {b && this.renderColumnForArea(...b)}
            </div>
          ))}
          <br/>
          <ProgressButtons>
            <Link to={this.props.toBack} className="button is-light is-medium">Back</Link>
            <LinkToNextStep toNext={this.props.toNext} />
          </ProgressButtons>
        </div>

      </Page>
    );
  }
}

type IssuesRoutesProps = {
  routes: IssuesRouteInfo,
  introContent?: string|JSX.Element,
  toBack: string,
  toNext: string
};

export function IssuesRoutes(props: IssuesRoutesProps): JSX.Element {
  const { routes } = props;
  return (
    <Switch>
      <Route path={routes.home} exact render={() => (
        <IssuesHome {...props} />
      )} />
      <Route path={routes.area.parameterizedRoute} render={(ctx) => (
        <IssuesArea {...ctx} toHome={routes.home} />
      )} />
    </Switch>
  );
}
