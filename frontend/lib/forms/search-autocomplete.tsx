import React from "react";
import Downshift, {
  ControllerStateAndHelpers,
  DownshiftInterface,
} from "downshift";
import classnames from "classnames";
import autobind from "autobind-decorator";
import { WithFormFieldErrors, formatErrors } from "./form-errors";
import { bulmaClasses } from "../ui/bulma";
import { awesomeFetch, createAbortController } from "../networking/fetch";
import { renderLabel, LabelRenderer, AutofocusedInput } from "./form-fields";
import { KEY_ENTER, KEY_TAB } from "../util/key-codes";
import {
  SearchRequester,
  SearchRequesterOptions,
} from "@justfixnyc/geosearch-requester";

// https://stackoverflow.com/a/4565120
function isChrome(): boolean {
  return (
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  );
}

/**
 * Return the browser-specific "autocomplete" attribute value to disable
 * autocomplete on a form field.
 *
 * This is mostly needed because Chrome is extremely aggressive with
 * respect to autocompleting form fields, and the behavior seems to
 * change from one release to the next.
 *
 * For more details on why Chrome ignores the standard autocomplete="off",
 * see: https://bugs.chromium.org/p/chromium/issues/detail?id=468153#c164
 */
function getBrowserAutoCompleteOffValue(): string {
  // Components using this should only be progressively-enhanced ones, meaning
  // that the initial render on the server-side is for the baseline component.
  // Otherwise we'd run into issues where the client-side initial render
  // would be different from the SSR, which is bad.
  if (typeof navigator === "undefined") {
    throw new Error(
      "Assertion failure, this function should only be called in the browser!"
    );
  }

  // https://gist.github.com/niksumeiko/360164708c3b326bd1c8#gistcomment-2666079
  return isChrome() ? "disabled" : "off";
}

export type SearchAutocompleteHelpers<Item, SearchResults> = {
  /**
   * A factory to create a `SearchRequester` for our particular
   * kind of search result.
   */
  createSearchRequester: (
    options: SearchRequesterOptions<SearchResults>
  ) => SearchRequester<SearchResults>;

  /**
   * Convert an autocomplete item into a `key` prop, used when listing
   * autocomplete results.
   */
  itemToKey: (item: Item) => any;

  /**
   * Convert an autocomplete item to a string, used when listing
   * and comparing autocomplete results.
   */
  itemToString: (item: Item | null) => string;

  /**
   * If what the user has typed so far doesn't map to a current
   * item in the autocomplete list, this converts it to an item
   * that at least preserves what the user has typed.
   *
   * This is basically a fallback to ensure that the user's input isn't lost if
   * they are typing and happen to (intentionally or accidentally) do something
   * that causes the autocomplete to lose focus.
   */
  getIncompleteItem: (value: string | null) => Item;

  /**
   * A function that converts what the search API has returned into
   * a list of autocomplete items.
   */
  searchResultsToItems: (results: SearchResults) => Item[];
};

export interface SearchAutocompleteProps<Item, SearchResults>
  extends WithFormFieldErrors {
  label: string;
  renderLabel?: LabelRenderer;
  initialValue?: Item;
  onChange: (item: Item) => void;
  onNetworkError: (err: Error) => void;
  helpers: SearchAutocompleteHelpers<Item, SearchResults>;
  autoFocus?: boolean;
}

interface SearchAutocompleteState<Item> {
  isLoading: boolean;
  results: Item[];
  inputName?: string;
}

/**
 * The amount of ms we'll wait after the user pressed a key
 * before we'll issue a network request to fetch autocompletion
 * results.
 */
const AUTOCOMPLETE_KEY_THROTTLE_MS = 250;

/**
 * A generic search autocomplete field. This should only be used as a
 * progressive enhancement, since it requires JavaScript and uses
 * a third-party API that might become unavailable.
 */
export class SearchAutocomplete<Item, SearchResults> extends React.Component<
  SearchAutocompleteProps<Item, SearchResults>,
  SearchAutocompleteState<Item>
> {
  requester: SearchRequester<SearchResults>;

  constructor(props: SearchAutocompleteProps<Item, SearchResults>) {
    super(props);
    this.state = {
      isLoading: false,
      results: [],
    };
    this.requester = this.props.helpers.createSearchRequester({
      createAbortController,
      fetch: awesomeFetch,
      throttleMs: AUTOCOMPLETE_KEY_THROTTLE_MS,
      onError: this.handleRequesterError,
      onResults: this.handleRequesterResults,
    });
  }

  renderListItem(
    ds: ControllerStateAndHelpers<Item>,
    item: Item,
    index: number
  ): JSX.Element {
    const props = ds.getItemProps({
      key: this.props.helpers.itemToKey(item),
      index,
      item,
      className: classnames({
        "jf-autocomplete-is-highlighted": ds.highlightedIndex === index,
        "jf-autocomplete-is-selected": ds.selectedItem === item,
      }),
    });

    return <li {...props}>{this.props.helpers.itemToString(item)}</li>;
  }

  /**
   * Set the current selected item based on incomplete input.
   *
   * This is basically a fallback to ensure that the user's input isn't lost if
   * they are typing and happen to (intentionally or accidentally) do something
   * that causes the autocomplete to lose focus.
   */
  selectIncompleteItem(ds: ControllerStateAndHelpers<Item>) {
    if (
      !ds.selectedItem ||
      this.props.helpers.itemToString(ds.selectedItem) !== ds.inputValue
    ) {
      ds.selectItem(this.props.helpers.getIncompleteItem(ds.inputValue));
    }
  }

  /**
   * If the result list is non-empty and visible, and the user hasn't selected
   * anything, select the first item in the list and return true.
   *
   * Otherwise, return false.
   */
  selectFirstResult(ds: ControllerStateAndHelpers<Item>): boolean {
    const { results } = this.state;
    if (ds.highlightedIndex === null && ds.isOpen && results.length > 0) {
      ds.selectItem(results[0]);
      return true;
    }
    return false;
  }

  /**
   * Despite all our efforts to make Chome disable its built-in autocomplete, we
   * somehow still fail, so our only other resort is to change the `name` attribute
   * of our `<input>` element to something that Chrome won't have any autocomplete
   * information for.
   */
  makeChromeNotBeAnnoying() {
    if (isChrome()) {
      this.setState({
        inputName: `omfg-chrome-stop-autocompleting-this-field-${Date.now()}`,
      });
    }
  }

  handleAutocompleteKeyDown(
    ds: ControllerStateAndHelpers<Item>,
    event: React.KeyboardEvent
  ) {
    this.makeChromeNotBeAnnoying();
    if (event.keyCode === KEY_ENTER || event.keyCode === KEY_TAB) {
      if (this.selectFirstResult(ds)) {
        event.preventDefault();
      } else {
        this.selectIncompleteItem(ds);
      }
    }
  }

  getInputProps(ds: ControllerStateAndHelpers<Item>) {
    return ds.getInputProps<React.HTMLProps<HTMLInputElement>>({
      autoComplete: getBrowserAutoCompleteOffValue(),
      onFocus: () => this.makeChromeNotBeAnnoying(),
      onBlur: () => this.selectIncompleteItem(ds),
      onKeyDown: (event) => this.handleAutocompleteKeyDown(ds, event),
      onChange: (event) =>
        this.handleInputValueChange(event.currentTarget.value),
    });
  }

  renderAutocomplete(ds: ControllerStateAndHelpers<Item>): JSX.Element {
    const { errorHelp } = formatErrors(this.props);
    const { results } = this.state;

    return (
      <div className="field jf-autocomplete-field">
        {renderLabel(
          this.props.label,
          ds.getLabelProps(),
          this.props.renderLabel
        )}
        <div
          className={bulmaClasses("control", {
            "is-loading": this.state.isLoading,
          })}
        >
          <AutofocusedInput
            name={this.state.inputName}
            className="input"
            autoFocus={this.props.autoFocus}
            {...this.getInputProps(ds)}
          />
          <ul
            className={classnames({
              "jf-autocomplete-open": ds.isOpen && results.length > 0,
            })}
            {...ds.getMenuProps()}
          >
            {ds.isOpen &&
              results.map((item, i) => this.renderListItem(ds, item, i))}
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
  handleRequesterResults(results: SearchResults) {
    this.setState({
      isLoading: false,
      results: this.props.helpers.searchResultsToItems(results),
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
    const ItemDownshift = Downshift as DownshiftInterface<Item>;
    return (
      <ItemDownshift
        onChange={(item) => item && this.props.onChange(item)}
        initialSelectedItem={this.props.initialValue}
        itemToString={this.props.helpers.itemToString}
      >
        {(downshift) => this.renderAutocomplete(downshift)}
      </ItemDownshift>
    );
  }
}
