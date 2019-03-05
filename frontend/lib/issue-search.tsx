import React from 'react';
import classnames from 'classnames';
import { issueArea } from './issues';
import Downshift, { DownshiftInterface, ControllerStateAndHelpers } from 'downshift';
import { getIssueChoiceLabels, IssueChoices } from '../../common-data/issue-choices';
import { getIssueAreaChoiceLabels } from '../../common-data/issue-area-choices';

interface IssueAutocompleteItem {
  value: string;
  label: string;
  areaValue: string;
  areaLabel: string;
  searchableText: string;
}

const IssueDownshift = Downshift as DownshiftInterface<IssueAutocompleteItem|string>;

function getAllAutocompleteitems(): IssueAutocompleteItem[] {
  const issueLabels = getIssueChoiceLabels();
  const issueAreaLabels = getIssueAreaChoiceLabels();
  return IssueChoices.map(value => {
    const areaValue = issueArea(value);
    const areaLabel = issueAreaLabels[areaValue];
    const label = issueLabels[value];
    return {
      value,
      label,
      areaValue,
      areaLabel,
      searchableText: [areaLabel.toLowerCase(), '-', label.toLowerCase()].join(' ')
    }
  });
}

function filterAutocompleteItems(searchString: string): IssueAutocompleteItem[] {
  searchString = searchString.toLowerCase();
  return getAllAutocompleteitems().filter(item =>
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
