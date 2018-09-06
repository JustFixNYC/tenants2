import React from 'react';

import { DjangoChoices, safeGetDjangoChoiceLabel } from "../../common-data";
import Page from '../../page';
import Routes, { RouteTypes } from '../../routes';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';
import { NotFound } from '../../pages/not-found';
import { FormSubmitter, FormContext } from '../../forms';
import { IssueAreaInput } from '../../queries/globalTypes';
import { fetchIssueAreaMutation } from '../../queries/IssueAreaMutation';
import autobind from 'autobind-decorator';
import { assertNotNull } from '../../util';
import { AppContextType, withAppContext } from '../../app-context';
import { MultiCheckboxFormField, BaseFormFieldProps } from '../../form-fields';
import { NextButton } from '../../pages/onboarding-step-1';

const ISSUE_AREA_CHOICES = require('../../../../common-data/issue-area-choices.json') as DjangoChoices;

const ISSUE_CHOICES = require('../../../../common-data/issue-choices.json') as DjangoChoices;

function issueArea(issue: string): string {
  return issue.split('__')[0];
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
      .then(result => result.issueArea);
  }

  @autobind
  renderForm(ctx: FormContext<IssueAreaInput>, area: string): JSX.Element {
    // It's annoying that we have to typecast here, but due to annoying bugs with the GraphQL
    // schema, we need to.
    const fieldProps = ctx.fieldPropsFor('issues') as BaseFormFieldProps<string[]>;

    return (
      <React.Fragment>
        <MultiCheckboxFormField {...fieldProps} label="Select your issues" choices={issueChoicesForArea(area)} />
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
    const area = this.props.match.params.area;
    const label = safeGetDjangoChoiceLabel(ISSUE_AREA_CHOICES, area);
    const initialState: IssueAreaInput = {
      area,
      issues: issuesForArea(area, this.props.session.issues || [])
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

function IssuesHome(): JSX.Element {
  return (
    <Page title="Issue checklist">
      <h1 className="title">Issue checklist</h1>
      {ISSUE_AREA_CHOICES.map(([value, label]) => (
        <Link key={value} to={Routes.loc.issues.area.create(value)} className="button is-fullwidth">
          {label}
        </Link>
      ))}
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
