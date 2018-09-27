import React from 'react';
import classnames from 'classnames';
import { safeGetDjangoChoiceLabel, allCapsToSlug, slugToAllCaps, getDjangoChoiceLabel } from "../common-data";
import Page from '../page';
import Routes, { RouteTypes } from '../routes';
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
import Downshift, { DownshiftInterface, ControllerStateAndHelpers } from 'downshift';
import { SimpleProgressiveEnhancement } from '../progressive-enhancement';
import { issueChoicesForArea, ISSUE_AREA_CHOICES, issuesForArea, customIssueForArea, issueArea, areaIssueCount, ISSUE_CHOICES } from '../issues';

type IssuesAreaPropsWithCtx = RouteTypes.loc.issues.area.RouteProps;

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
        <p>Don't see your issues listed? You can add additional issues below.</p>
        <br/>
        <TextareaFormField {...ctx.fieldPropsFor('other')} label="Additional issues" />
        {this.renderFormButtons(ctx.isLoading)}
      </React.Fragment>
    );
  }

  renderFormButtons(isLoading: boolean): JSX.Element {
    return (
      <div className="buttons">
        <BackButton to={Routes.loc.issues.home} />
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
    return (
      <Page title={`${label} - Issue checklist`}>
        <h1 className="title">{label} issues</h1>
        <SessionUpdatingFormSubmitter
          mutation={IssueAreaMutation}
          initialState={getInitialState}
          onSuccessRedirect={Routes.loc.issues.home}
        >
          {(formCtx) => this.renderForm(formCtx, area)}
        </SessionUpdatingFormSubmitter>
      </Page>
    );
  }
}

interface IssueAutocompleteItem {
  value: string;
  label: string;
  areaValue: string;
  areaLabel: string;
  searchableText: string;
}

const IssueDownshift = Downshift as DownshiftInterface<IssueAutocompleteItem|string>;

const ALL_AUTOCOMPLETE_ITEMS: IssueAutocompleteItem[] = ISSUE_CHOICES.map(([value, label]) => {
  const areaValue = issueArea(value);
  const areaLabel = getDjangoChoiceLabel(ISSUE_AREA_CHOICES, areaValue);
  return {
    value,
    label,
    areaValue,
    areaLabel,
    searchableText: [areaLabel.toLowerCase(), '-', label.toLowerCase()].join(' ')
  }
});

function filterAutocompleteItems(searchString: string): IssueAutocompleteItem[] {
  searchString = searchString.toLowerCase();
  return ALL_AUTOCOMPLETE_ITEMS.filter(item =>
    item.searchableText.indexOf(searchString) !== -1);
}

export function doesAreaMatchSearch(areaValue: string, searchString: string): boolean {
  if (!searchString) return false;
  const items = filterAutocompleteItems(searchString);
  for (let item of items) {
    if (item.areaValue === areaValue) {
      return true;
    }
  }
  return false;
}

interface IssueAutocompleteProps {
  inputValue: string;
  onInputValueChange: (value: string) => void;
}

function autocompleteItemToString(item: IssueAutocompleteItem|string|null): string {
  return item
    ? typeof(item) === 'string'
      ? item
      : `${item.areaLabel} - ${item.label}`
    : '';
}

export class IssueAutocomplete extends React.Component<IssueAutocompleteProps> {
  renderAutocompleteList(ds: ControllerStateAndHelpers<IssueAutocompleteItem|string>): JSX.Element {
    const results = ds.inputValue ? filterAutocompleteItems(ds.inputValue) : [];

    return (
      <ul className={classnames({
        'jf-autocomplete-open': ds.isOpen && results.length > 0
      })} {...ds.getMenuProps()}>
        {ds.isOpen && results.map((item, index) => {
          const props = ds.getItemProps({
            key: item.value,
            index,
            item,
            className: classnames({
              'jf-autocomplete-is-highlighted': ds.highlightedIndex === index,
              'jf-autocomplete-is-selected': ds.selectedItem === item
            })
          });
          return <li {...props}>{item.areaLabel} - {item.label}</li>
        })}
      </ul>
    );
  }

  render() {
    return <IssueDownshift
      onInputValueChange={this.props.onInputValueChange}
      onChange={(item) => this.props.onInputValueChange(autocompleteItemToString(item))}
      inputValue={this.props.inputValue}
      selectedItem={this.props.inputValue}
      itemToString={autocompleteItemToString}
    >{(ds) => {
      return (
        <div className="field jf-autocomplete-field">
          <label className="jf-sr-only" {...ds.getLabelProps()}>Search</label>
          <div className="control">
            <input className="input" placeholder="Search for issues here" {...ds.getInputProps()} />
            {this.renderAutocompleteList(ds)}
          </div>
        </div>
      );
    }}</IssueDownshift>;
  }
}

export function getIssueLabel(count: number): string {
  return count === 0 ? 'No issues reported'
    : count === 1 ? 'One issue reported'
      : `${count} issues reported`;
}

export function getIssueAreaImagePath(area: string): string {
  return `frontend/img/issues/${allCapsToSlug(area)}.svg`;
}

function IssueAreaLink(props: { area: string, label: string, isHighlighted?: boolean }): JSX.Element {
  const { area, label } = props;

  return (
    <AppContext.Consumer>
      {(ctx) => {
        const count = areaIssueCount(area, ctx.session.issues, ctx.session.customIssues);
        const iconSrc = `${ctx.server.staticURL}${getIssueAreaImagePath(area)}`;
        const url = Routes.loc.issues.area.create(allCapsToSlug(area));
        const actionLabel = count === 0 ? 'Add issues' : 'Add or remove issues';
        const title = `${actionLabel} for ${label}`;
        const issueLabel = getIssueLabel(count);
        const ariaLabel = `${title} (${issueLabel})`;

        return (
          <Link to={url} className={classnames('jf-issue-area-link', props.isHighlighted && 'jf-highlight')} title={title} aria-label={ariaLabel}>
              <img src={iconSrc} alt="" />
            <p><strong>{label}</strong></p>
            <p className="is-size-7">{issueLabel}</p>
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

class IssuesHome extends React.Component<{}, IssuesHomeState> {
  constructor(props: {}) {
    super(props);
    this.state = { searchText: '' };
  }

  renderColumnForArea(area: string, label: string): JSX.Element {
    return <div className="column">
      <IssueAreaLink
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
        this.setState({ searchText })
      }}
    />;
  }

  render() {
    return (
      <Page title="Issue checklist">
        <h1 className="title">Issue checklist</h1>
        <SimpleProgressiveEnhancement>
          {this.renderAutocomplete()}
        </SimpleProgressiveEnhancement>
        {groupByTwo(ISSUE_AREA_CHOICES).map(([a, b], i) => (
          <div className="columns is-mobile" key={i}>
            {this.renderColumnForArea(...a)}
            {b && this.renderColumnForArea(...b)}
          </div>
        ))}
        <br/>
        <div className="buttons">
          <Link to={Routes.loc.whyMail} className="button is-text">Back</Link>
          <Link to={Routes.loc.accessDates} className="button is-primary">Next</Link>
        </div>
      </Page>
    );  
  }
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
