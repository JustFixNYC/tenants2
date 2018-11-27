import React from 'react';
import classnames from 'classnames';
import { safeGetDjangoChoiceLabel, allCapsToSlug, slugToAllCaps } from "../common-data";
import Page from '../page';
import { IssuesRouteInfo, IssuesRouteAreaProps } from '../routes';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { NotFound } from './not-found';
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { IssueAreaInput } from '../queries/globalTypes';
import { IssueAreaMutation } from '../queries/IssueAreaMutation';
import autobind from 'autobind-decorator';
import { AppContext } from '../app-context';
import { MultiCheckboxFormField, TextareaFormField, HiddenFormField } from '../form-fields';
import { NextButton, BackButton } from "../buttons";
import { AllSessionInfo } from '../queries/AllSessionInfo';
import { SimpleProgressiveEnhancement } from '../progressive-enhancement';
import { issueChoicesForArea, ISSUE_AREA_CHOICES, issuesForArea, customIssueForArea, areaIssueCount } from '../issues';
import { doesAreaMatchSearch, IssueAutocomplete } from '../issue-search';
import { ga } from '../google-analytics';
import ISSUE_AREA_SVGS from '../svg/issues';
import { assertNotUndefined } from '../util';

const checkSvg = require('../svg/check-solid.svg') as JSX.Element;

type IssuesAreaPropsWithCtx = IssuesRouteAreaProps & {
  toHome: string
};

export class IssuesArea extends React.Component<IssuesAreaPropsWithCtx> {
  @autobind
  renderForm(ctx: FormContext<IssueAreaInput>, area: string): JSX.Element {
    return (
      <React.Fragment>
        <HiddenFormField {...ctx.fieldPropsFor('area')} />
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor('issues')}
          label="Select your issues"
          choices={issueChoicesForArea(area)}
        />
        <TextareaFormField {...ctx.fieldPropsFor('other')} label="Don't see your issues listed? You can add additional issues below." />
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="buttons jf-two-buttons">
        <BackButton to={this.props.toHome} />
        <NextButton isLoading={isLoading} label="Save" />
      </div>
    );
  }

  render() {
    const area = slugToAllCaps(this.props.match.params.area);
    const label = safeGetDjangoChoiceLabel(ISSUE_AREA_CHOICES, area);
    const getInitialState = (session: AllSessionInfo): IssueAreaInput => ({
      area,
      issues: issuesForArea(area, session.issues),
      other: customIssueForArea(area, session.customIssues)
    });
    if (label === null) {
      return <NotFound {...this.props} />;
    }
    const svg = assertNotUndefined(ISSUE_AREA_SVGS[area]);
    return (
      <Page title={`${label} - Issue checklist`}>
        <div>
          <h1 className="title is-4 jf-issue-area">{svg} {label} issues</h1>
          <SessionUpdatingFormSubmitter
            confirmNavIfChanged
            mutation={IssueAreaMutation}
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
  area: string;
  label: string;
  isHighlighted?: boolean;
  routes: IssuesRouteInfo;
};

function IssueAreaLink(props: IssueAreaLinkProps): JSX.Element {
  const { area, label } = props;

  return (
    <AppContext.Consumer>
      {(ctx) => {
        const count = areaIssueCount(area, ctx.session.issues, ctx.session.customIssues);
        const url = props.routes.area.create(allCapsToSlug(area));
        const actionLabel = count === 0 ? 'Add issues' : 'Add or remove issues';
        const title = `${actionLabel} for ${label}`;
        const issueLabel = getIssueLabel(count);
        const ariaLabel = `${title} (${issueLabel})`;
        const svg = assertNotUndefined(ISSUE_AREA_SVGS[area]);

        return (
          <Link to={url} className={classnames(
            'jf-issue-area-link', 'notification',
            props.isHighlighted && 'jf-highlight',
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

interface IssuesHomeState {
  searchText: string;
}

type IssuesHomeProps = IssuesRoutesProps;

class IssuesHome extends React.Component<IssuesHomeProps, IssuesHomeState> {
  constructor(props: IssuesHomeProps) {
    super(props);
    this.state = { searchText: '' };
  }

  renderColumnForArea(area: string, label: string): JSX.Element {
    return <div className="column">
      <IssueAreaLink
        routes={this.props.routes}
        area={area}
        label={label}
        isHighlighted={doesAreaMatchSearch(area, this.state.searchText)}
      />
    </div>;
  }

  renderAutocomplete(): JSX.Element {
    return <IssueAutocomplete
      inputValue={this.state.searchText}
      onInputValueChange={(searchText) => {
        ga('send', 'event', 'issue-search', 'change', searchText);
        this.setState({ searchText })
      }}
    />;
  }

  render() {
    return (
      <Page title="Apartment self-inspection">
        <div>
          <h1 className="title is-4 is-spaced">Apartment self-inspection</h1>
          <p className="subtitle is-6">Please go room-by-room and select all of the issues that you are experiencing. This <strong>issue checklist</strong> will be sent to your landlord. <strong>Don't hold back!</strong></p>
          <SimpleProgressiveEnhancement>
            {this.renderAutocomplete()}
          </SimpleProgressiveEnhancement>
          {groupByTwo(ISSUE_AREA_CHOICES).map(([a, b], i) => (
            <div className="columns is-tablet" key={i}>
              {this.renderColumnForArea(...a)}
              {b && this.renderColumnForArea(...b)}
            </div>
          ))}
          <br/>
          <div className="buttons jf-two-buttons">
            <Link to={this.props.toBack} className="button is-light is-medium">Back</Link>
            <Link to={this.props.toNext} className="button is-primary is-medium">Next</Link>
          </div>
        </div>

      </Page>
    );
  }
}

type IssuesRoutesProps = {
  routes: IssuesRouteInfo,
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
