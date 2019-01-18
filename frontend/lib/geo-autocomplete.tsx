import React from 'react';
import Downshift, { ControllerStateAndHelpers, DownshiftInterface } from 'downshift';
import classnames from 'classnames';
import autobind from 'autobind-decorator';
import { BoroughChoice, getBoroughLabel } from './boroughs';
import { WithFormFieldErrors, formatErrors } from './form-errors';
import { bulmaClasses } from './bulma';
import { awesomeFetch, createAbortController } from './fetch';
import { renderLabel, LabelRenderer } from './form-fields';
import { KEY_ENTER, KEY_TAB } from './key-codes';
import { GeoSearchBoroughGid, GeoSearchResults, GeoSearchRequester } from './geo-autocomplete-base';

function boroughGidToChoice(gid: GeoSearchBoroughGid): BoroughChoice {
  switch (gid) {
    case GeoSearchBoroughGid.Manhattan: return BoroughChoice.MANHATTAN;
    case GeoSearchBoroughGid.Bronx: return BoroughChoice.BRONX;
    case GeoSearchBoroughGid.Brooklyn: return BoroughChoice.BROOKLYN;
    case GeoSearchBoroughGid.Queens: return BoroughChoice.QUEENS;
    case GeoSearchBoroughGid.StatenIsland: return BoroughChoice.STATEN_ISLAND;
  }

  throw new Error(`No borough found for ${gid}!`);
}

export interface GeoAutocompleteItem {
  address: string;
  borough: BoroughChoice | null;
};

interface GeoAutocompleteProps extends WithFormFieldErrors {
  label: string;
  renderLabel?: LabelRenderer;
  initialValue?: GeoAutocompleteItem;
  onChange: (item: GeoAutocompleteItem) => void;
  onNetworkError: (err: Error) => void;
};

interface GeoAutocompleteState {
  isLoading: boolean;
  results: GeoAutocompleteItem[];
}

const GeoDownshift = Downshift as DownshiftInterface<GeoAutocompleteItem>;

/**
 * The amount of ms we'll wait after the user pressed a key
 * before we'll issue a network request to fetch autocompletion
 * results.
 */
const AUTOCOMPLETE_KEY_THROTTLE_MS = 250;

/** The maximum number of autocomplete suggestions to show. */
const MAX_SUGGESTIONS = 5;

/**
 * An address autocomplete field. This should only be used as a
 * progressive enhancement, since it requires JavaScript and uses
 * a third-party API that might become unavailable.
 */
export class GeoAutocomplete extends React.Component<GeoAutocompleteProps, GeoAutocompleteState> {
  requester: GeoSearchRequester;

  constructor(props: GeoAutocompleteProps) {
    super(props);
    this.state = {
      isLoading: false,
      results: []
    };
    this.requester = new GeoSearchRequester({
      createAbortController,
      fetch: awesomeFetch,
      throttleMs: AUTOCOMPLETE_KEY_THROTTLE_MS,
      onError: this.handleRequesterError,
      onResults: this.handleRequesterResults
    });
  }

  renderListItem(ds: ControllerStateAndHelpers<GeoAutocompleteItem>,
                 item: GeoAutocompleteItem,
                 index: number): JSX.Element {
    const props = ds.getItemProps({
      key: item.address + item.borough,
      index,
      item,
      className: classnames({
        'jf-autocomplete-is-highlighted': ds.highlightedIndex === index,
        'jf-autocomplete-is-selected': ds.selectedItem === item
      })
    });

    return (
      <li {...props}>
        {geoAutocompleteItemToString(item)}
      </li>
    );
  }

  /**
   * Set the current selected item to an address consisting of the user's current
   * input and no borough.
   *
   * This is basically a fallback to ensure that the user's input isn't lost if
   * they are typing and happen to (intentionally or accidentally) do something
   * that causes the autocomplete to lose focus.
   */
  selectIncompleteAddress(ds: ControllerStateAndHelpers<GeoAutocompleteItem>) {
    if (!ds.selectedItem || geoAutocompleteItemToString(ds.selectedItem) !== ds.inputValue) {
      ds.selectItem({
        address: ds.inputValue || '',
        borough: null
      });
    }
  }

  /**
   * If the result list is non-empty and visible, and the user hasn't selected
   * anything, select the first item in the list and return true.
   *
   * Otherwise, return false.
   */
  selectFirstResult(ds: ControllerStateAndHelpers<GeoAutocompleteItem>): boolean {
    const { results } = this.state;
    if (ds.highlightedIndex === null && ds.isOpen && results.length > 0) {
      ds.selectItem(results[0]);
      return true;
    }
    return false;
  }

  handleAutocompleteKeyDown(ds: ControllerStateAndHelpers<GeoAutocompleteItem>, event: React.KeyboardEvent) {
    if (event.keyCode === KEY_ENTER || event.keyCode === KEY_TAB) {
      if (this.selectFirstResult(ds)) {
        event.preventDefault();
      } else {
        this.selectIncompleteAddress(ds);
      }
    }
  }

  getInputProps(ds: ControllerStateAndHelpers<GeoAutocompleteItem>) {
    return ds.getInputProps({
      autoComplete: 'address-line1 street-address',
      onBlur: () => this.selectIncompleteAddress(ds),
      onKeyDown: (event) => this.handleAutocompleteKeyDown(ds, event),
      onChange: (event) => this.handleInputValueChange(event.currentTarget.value)
    });
  }

  renderAutocomplete(ds: ControllerStateAndHelpers<GeoAutocompleteItem>): JSX.Element {
    const { errorHelp } = formatErrors(this.props);
    const { results } = this.state;

    return (
      <div className="field jf-autocomplete-field">
        {renderLabel(this.props.label, ds.getLabelProps(), this.props.renderLabel)}
        <div className={bulmaClasses('control', {
          'is-loading': this.state.isLoading
        })}>
          <input className="input" {...this.getInputProps(ds)} />
          <ul className={classnames({
            'jf-autocomplete-open': ds.isOpen && results.length > 0
          })} {...ds.getMenuProps()}>
            {ds.isOpen && results.map((item, i) => this.renderListItem(ds, item, i))}
          </ul>
        </div>
        {errorHelp}
      </div>
    );
  }

  @autobind
  handleRequesterError(e: Error) {
    // TODO: It would be nice if we could further differentiate
    // between a "you aren't connected to the internet"
    // error versus a "you issued a bad request" error, so that
    // we could report the error if it's the latter.
    this.props.onNetworkError(e);
  }

  @autobind
  handleRequesterResults(results: GeoSearchResults) {
    this.setState({
      isLoading: false,
      results: geoSearchResultsToAutocompleteItems(results)
    });
  }

  handleInputValueChange(value: string) {
    if (this.requester.changeSearchRequest(value)) {
      this.setState({ isLoading: true });
    } else {
      this.setState({ results: [], isLoading: false });
    }
  }

  componentWillUnmount() {
    this.requester.shutdown();
  }

  render() {
    return (
      <GeoDownshift
        onChange={this.props.onChange}
        defaultSelectedItem={this.props.initialValue}
        itemToString={geoAutocompleteItemToString}
      >
        {(downshift) => this.renderAutocomplete(downshift)}
      </GeoDownshift>
    );
  }
}

export function geoAutocompleteItemToString(item: GeoAutocompleteItem|null): string {
  if (!item) return '';
  if (!item.borough) return item.address;
  return `${item.address}, ${getBoroughLabel(item.borough)}`;
}

export function geoSearchResultsToAutocompleteItems(results: GeoSearchResults): GeoAutocompleteItem[] {
  return results.features.slice(0, MAX_SUGGESTIONS).map(feature => {
    const { borough_gid } = feature.properties;
    const borough = boroughGidToChoice(borough_gid);

    return {
      address: feature.properties.name,
      borough
    }
  });
}
