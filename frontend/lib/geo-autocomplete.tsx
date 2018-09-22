import React from 'react';
import Downshift, { ControllerStateAndHelpers, DownshiftInterface } from 'downshift';
import classnames from 'classnames';
import autobind from 'autobind-decorator';
import { BoroughChoice, getBoroughLabel } from './boroughs';
import { WithFormFieldErrors, formatErrors } from './form-errors';

/**
 * The keys here were obtained experimentally, I'm not actually sure
 * if/where they are formally specified.
 */
const BOROUGH_GID_TO_CHOICE: { [key: string]: BoroughChoice|undefined } = {
  'whosonfirst:borough:1': BoroughChoice.MANHATTAN,
  'whosonfirst:borough:2': BoroughChoice.BRONX,
  'whosonfirst:borough:3': BoroughChoice.BROOKLYN,
  'whosonfirst:borough:4': BoroughChoice.QUEENS,
  'whosonfirst:borough:5': BoroughChoice.STATEN_ISLAND,
};

export interface GeoAutocompleteItem {
  address: string;
  borough: BoroughChoice;
};

interface GeoAutocompleteProps extends WithFormFieldErrors {
  label: string;
  initialValue?: GeoAutocompleteItem;
  onChange: (item: GeoAutocompleteItem) => void;
  onNetworkError: (err: Error) => void;
};

interface GeoSearchProperties {
  /** e.g. "Brooklyn" */
  borough: string;

  /** e.g. "whosonfirst:borough:2" */
  borough_gid: string;

  /** e.g. "150" */
  housenumber: string;

  /** e.g. "150 COURT STREET" */
  name: string;

  /** e.g. "150 COURT STREET, Brooklyn, New York, NY, USA" */
  label: string;
}

interface GeoSearchResults {
  bbox: unknown;
  features: {
    geometry: unknown;
    properties: GeoSearchProperties
  }[];
}

interface GeoAutocompleteState {
  results: GeoAutocompleteItem[];
}

/**
 * The amount of ms we'll wait after the user pressed a key
 * before we'll issue a network request to fetch autocompletion
 * results.
 */
const AUTOCOMPLETE_KEY_THROTTLE_MS = 250;

/**
 * For documentation about this endpoint, see:
 * 
 * https://geosearch.planninglabs.nyc/docs/#autocomplete
 */
const GEO_AUTOCOMPLETE_URL = 'https://geosearch.planninglabs.nyc/v1/autocomplete';

/** The maximum number of autocomplete suggestions to show. */
const MAX_SUGGESTIONS = 5;

export class GeoAutocomplete extends React.Component<GeoAutocompleteProps, GeoAutocompleteState> {
  keyThrottleTimeout: number|null;
  abortController: AbortController;

  constructor(props: GeoAutocompleteProps) {
    super(props);
    this.state = {
      results: []
    };
    this.keyThrottleTimeout = null;
    this.abortController = new AbortController();
  }

  renderAutocomplete(ds: ControllerStateAndHelpers<GeoAutocompleteItem>): JSX.Element {
    let { errorHelp } = formatErrors(this.props);

    return (
      <div className="field jf-autocomplete-field">
        <label className="label" {...ds.getLabelProps()}>{this.props.label}</label>
        <div className="control">
          <input className="input" {...ds.getInputProps()} />
          <ul className={classnames({
            'jf-autocomplete-open': ds.isOpen && this.state.results.length > 0
          })} {...ds.getMenuProps()}>
            {ds.isOpen &&
              this.state.results
                .map((item, index) => {
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
                })
            }
          </ul>
        </div>
        {errorHelp}
      </div>
    );
  }

  resetSearchRequest() {
    if (this.keyThrottleTimeout !== null) {
      window.clearTimeout(this.keyThrottleTimeout);
      this.keyThrottleTimeout = null;
    }
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  @autobind
  handleFetchError(e: Error) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      // Don't worry about it, the user just aborted the request.
    } else {
      // TODO: It would be nice if we could further differentiate
      // between a "you aren't connected to the internet"
      // error versus a "you issued a bad request" error, so that
      // we could report the error if it's the latter.
      this.props.onNetworkError(e);
    }
  }

  @autobind
  handleInputValueChange(value: string) {
    this.resetSearchRequest();
    if (value.length > 3 && value.indexOf(' ') > 0) {
      this.keyThrottleTimeout = window.setTimeout(() => {
        fetch(`${GEO_AUTOCOMPLETE_URL}?text=${encodeURIComponent(value)}`, {
          signal: this.abortController.signal
        }).then(response => response.json())
          .then(results => this.setState({
            results: geoSearchResultsToAutocompleteItems(results)
          }))
          .catch(this.handleFetchError);
      }, AUTOCOMPLETE_KEY_THROTTLE_MS);
    } else {
      this.setState({ results: [] });
    }
  }

  componentWillUnmount() {
    this.resetSearchRequest();
  }

  render() {
    const GeoAutocomplete = Downshift as DownshiftInterface<GeoAutocompleteItem>;

    return (
      <GeoAutocomplete
        onChange={this.props.onChange}
        onInputValueChange={this.handleInputValueChange}
        defaultSelectedItem={this.props.initialValue}
        itemToString={geoAutocompleteItemToString}
      >
        {(downshift) => this.renderAutocomplete(downshift)}
      </GeoAutocomplete>
    );
  }
}

function geoAutocompleteItemToString(item: GeoAutocompleteItem|null): string {
  if (!item) return '';
  return `${item.address}, ${getBoroughLabel(item.borough)}`;
}

function geoSearchResultsToAutocompleteItems(results: GeoSearchResults): GeoAutocompleteItem[] {
  return results.features.slice(0, MAX_SUGGESTIONS).map(feature => {
    const { borough_gid } = feature.properties;
    const borough = BOROUGH_GID_TO_CHOICE[borough_gid];

    if (!borough) {
      throw new Error(`No borough found for ${borough_gid}!`);
    }

    return {
      address: feature.properties.name,
      borough
    }
  });
}
