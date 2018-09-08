import React from 'react';

import { DjangoChoices, safeGetDjangoChoiceLabel, allCapsToSlug, slugToAllCaps } from "../common-data";
import Page from '../page';
import Routes, { RouteTypes } from '../routes';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { NotFound } from './not-found';
import { FormSubmitter, FormContext } from '../forms';
import { IssueAreaInput } from '../queries/globalTypes';
import { fetchIssueAreaMutation } from '../queries/IssueAreaMutation';
import autobind from 'autobind-decorator';
import { assertNotNull } from '../util';
import { AppContextType, withAppContext, AppContext } from '../app-context';
import { MultiCheckboxFormField, TextareaFormField } from '../form-fields';
import { NextButton } from './onboarding-step-1';
import { AllSessionInfo_customIssues } from '../queries/AllSessionInfo';

const ISSUE_AREA_CHOICES = require('../../../common-data/issue-area-choices.json') as DjangoChoices;

const ISSUE_CHOICES = require('../../../common-data/issue-choices.json') as DjangoChoices;

export function customIssueForArea(area: string, customIssues: AllSessionInfo_customIssues[]): string {
  for (let ci of customIssues) {
    if (ci.area === area) return ci.description;
  }
  return '';
}

function issueArea(issue: string): string {
  return issue.split('__')[0];
}

export function areaIssueCount(area: string, issues: string[], customIssues: AllSessionInfo_customIssues[]): number {
  let count = 0;

  for (let issue of issues) {
    if (issueArea(issue) === area) {
      count += 1;
    }
  }

  for (let ci of customIssues) {
    if (ci.area === area) {
      count += 1;
    }
  }

  return count;
}

function issuesForArea(area: string, issues: string[]): string[] {
  return issues.filter(issue => issueArea(issue) === area);
}

function issueChoicesForArea(area: string): DjangoChoices {
  return ISSUE_CHOICES.filter(([value, label]) => issueArea(value) === area);
}

type IssuesAreaPropsWithCtx = RouteTypes.loc.issues.area.RouteProps & AppContextType;

class IssuesAreaWithoutCtx extends React.Component<IssuesAreaPropsWithCtx> {
  @autobind
  handleSubmit(input: IssueAreaInput) {
    return fetchIssueAreaMutation(this.props.fetch, { input })
      .then(result => result.output);
  }

  @autobind
  renderForm(ctx: FormContext<IssueAreaInput>, area: string): JSX.Element {
    return (
      <React.Fragment>
        <MultiCheckboxFormField
          {...ctx.fieldPropsFor('issues')}
          label="Select your issues"
          choices={issueChoicesForArea(area)}
        />
        <p>Don't see your issues listed? You can add additional issues below.</p>
        <TextareaFormField {...ctx.fieldPropsFor('other')} label="Additional issues" />
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="field is-grouped">
        <div className="control">
          <Link to={Routes.loc.issues.home} className="button is-text">Cancel and go back</Link>
        </div>
        <NextButton isLoading={isLoading} label="Save" />
      </div>
    );
  }

  render() {
    const area = slugToAllCaps(this.props.match.params.area);
    const label = safeGetDjangoChoiceLabel(ISSUE_AREA_CHOICES, area);
    const initialState: IssueAreaInput = {
      area,
      issues: issuesForArea(area, this.props.session.issues),
      other: customIssueForArea(area, this.props.session.customIssues)
    }
    if (label === null) {
      return <NotFound {...this.props} />;
    }
    return (
      <Page title={`${label} - Issue checklist`}>
        <h1 className="title">{label} issues</h1>
        <FormSubmitter
          onSubmit={this.handleSubmit}
          initialState={initialState}
          onSuccessRedirect={Routes.loc.issues.home}
          onSuccess={(output) => {
            this.props.updateSession(assertNotNull(output.session));
          }}
        >
          {(formCtx) => this.renderForm(formCtx, area)}
        </FormSubmitter>
      </Page>
    );
  }
}

export const IssuesArea = withAppContext(IssuesAreaWithoutCtx);

function IssueAreaLink(props: { area: string, label: string }): JSX.Element {
  const { area, label } = props;

  return (
    <AppContext.Consumer>
      {(ctx) => {
        const count = areaIssueCount(area, ctx.session.issues, ctx.session.customIssues);
        return (
          <Link to={Routes.loc.issues.area.create(allCapsToSlug(area))} className="button is-fullwidth">
            {label}
            <span className="tag is-info" data-jf-tag-count={count}>{count}</span>
          </Link>
        );
      }}
    </AppContext.Consumer>
  );
}

function IssuesHome(): JSX.Element {
  return (
    <Page title="Issue checklist">
      <h1 className="title">Issue checklist</h1>
      {ISSUE_AREA_CHOICES.map(([value, label]) => (
        <IssueAreaLink key={value} area={value} label={label} />
      ))}
      <br/>
      <div className="field is-grouped">
        <div className="control">
          <Link to={Routes.loc.whyMail} className="button is-text">Back</Link>
        </div>
        <div className="control">
          <Link to={Routes.loc.accessDates} className="button is-primary">Next</Link>
        </div>
      </div>
    </Page>
  );
}

export function IssuesRoutes(): JSX.Element {
  return (
    <Switch>
      <Route path={Routes.loc.issues.home} exact component={IssuesHome} />
      <Route path={Routes.loc.issues.area.parameterizedRoute} render={(ctx) => (
        <IssuesArea {...ctx} />
      )} />
    </Switch>
  );
}
