import React from 'react';
import Downshift, { ControllerStateAndHelpers, DownshiftInterface } from 'downshift';
import classnames from 'classnames';
import autobind from 'autobind-decorator';

type GeoAutocompleteItem = GeoSearchProperties;

interface GeoAutocompleteProps {
  label: string;
  initialValue: string;
  onChange: (item: GeoAutocompleteItem) => void;
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
                    key: item.label,
                    index,
                    item,
                    className: classnames({
                      'jf-autocomplete-is-highlighted': ds.highlightedIndex === index,
                      'jf-autocomplete-is-selected': ds.selectedItem === item
                    })
                  });

                  return (
                    <li {...props}>
                      {item.name}, {item.borough}
                    </li>
                  );
                })
            }
          </ul>
        </div>
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
      console.error('Alas, an error occurred: ', e);
    }
  }

  @autobind
  handleSearchResults(results: GeoSearchResults) {
    this.setState({
      results: results.features.map(feature => feature.properties).slice(0, MAX_SUGGESTIONS)
    });
  }

  @autobind
  handleInputValueChange(value: string) {
    this.resetSearchRequest();
    if (value.length > 3 && value.indexOf(' ') > 0) {
      this.keyThrottleTimeout = window.setTimeout(() => {
        fetch(`${GEO_AUTOCOMPLETE_URL}?text=${encodeURIComponent(value)}`, {
          signal: this.abortController.signal
        }).then(response => response.json())
          .then(this.handleSearchResults)
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
        defaultInputValue={this.props.initialValue}
        itemToString={item => item ? `${item.name}, ${item.borough}` : ''}
      >
        {(downshift) => this.renderAutocomplete(downshift)}
      </GeoAutocomplete>
    );
  }
}
