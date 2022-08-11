import * as rt from "@testing-library/react";
import { getHTMLElement } from "@justfixnyc/util";
import { queryHelpers, Matcher } from "@testing-library/react";

/**
 * A type for expressing how to fill out a form field.
 *
 * The first element of the tuple is the matcher for the
 * form field, while the second is the value to set the
 * form field to.
 */
export type FormFieldFill = [RegExp | string, string];

/**
 * Any HTML element that can be used as a form field, with some
 * modifications to make type checking easier.
 */
type FormFieldElement = (
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
) & {
  checked?: boolean;
};

/**
 * This class encapsulates react-testing-library in a slightly
 * easier-to-use API.
 */
export default class ReactTestingLibraryPal {
  /**
   * Quick access to the react-testing-library API. For details, see:
   *
   *   https://github.com/kentcdodds/react-testing-library
   */
  readonly rt: typeof rt;

  readonly rr: rt.RenderResult;

  /** Create a testing pal from the given JSX. */
  constructor(el: JSX.Element) {
    this.rr = rt.render(el);
    this.rt = rt;
  }

  /**
   * Find an element within our render result.
   *
   * @param tagName The name of the element's HTML tag.
   * @param selector The selector for the element, not including its HTML tag.
   */
  getElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    selector: string = ""
  ): HTMLElementTagNameMap[K] {
    return getHTMLElement(tagName, selector, this.rr.baseElement);
  }

  /** Click anything with the given text and selector. */
  click(matcher: RegExp | string, selector: string) {
    return rt.fireEvent.click(this.getByTextAndSelector(matcher, selector));
  }

  /** Click a list item in the render result. */
  clickListItem(matcher: RegExp | string) {
    return this.click(matcher, "li");
  }

  /** Click a button or link in the render result. */
  clickButtonOrLink(matcher: RegExp | string) {
    return this.click(
      matcher,
      "a, button, a > .jf-sr-only, button > .jf-sr-only"
    );
  }

  /** Click a radio button or checkbox in the render result. */
  clickRadioOrCheckbox(matcher: RegExp | string) {
    return rt.fireEvent.click(this.getByLabelTextAndSelector(matcher, "input"));
  }

  /**
   * Return a form field (e.g. an <input> or <select>) in the render result,
   * given label text or a regular expression matching the label text.
   */
  getFormField(label: string | RegExp): FormFieldElement {
    return this.getByLabelTextAndSelector(
      label,
      "input, select, textarea"
    ) as FormFieldElement;
  }

  /**
   * Return the first form field (e.g. an <input> or <select>) from the
   * render result that matches.
   */
  getFirstFormField(label: string | RegExp): FormFieldElement {
    return this.getByLabelTextAndSelector(
      label,
      "input, select, textarea"
    ) as FormFieldElement;
  }

  /** Send a keyDown event to the given form field with the give key code. */
  keyDownOnFormField(label: string | RegExp, keyCode: number) {
    return rt.fireEvent.keyDown(this.getFormField(label), { keyCode });
  }

  /** Fill out multiple form fields in the render result. */
  fillFormFields(fills: FormFieldFill[]) {
    fills.forEach(([matcher, value]) => {
      const input = this.getFormField(matcher);
      rt.fireEvent.change(input, { target: { value } });
    });
  }

  /** Fill out a form field in the render result. */
  fillFirstFormField(fill: FormFieldFill) {
    const [matcher, value] = fill;
    const matches = this.rr.getAllByLabelText(matcher);
    if (matches.length === 0) {
      throw queryHelpers.getElementError(
        `Could not find element with label text "${matcher}"`,
        this.rr.container
      );
    }
    rt.fireEvent.change(matches[0], { target: { value } });
  }

  /** Retrieve a modal dialog with the given label in the render result. */
  getDialogWithLabel(matcher: RegExp | string): HTMLDivElement {
    return this.getByLabelTextAndSelector(
      matcher,
      'div[role="dialog"]'
    ) as HTMLDivElement;
  }

  /**
   * Given a list of elements, find the one element matching the given selector,
   * raising an exception if there is zero or more than one match.
   */
  private getMatchFromSelector(
    matcher: RegExp | string,
    allMatches: HTMLElement[],
    selector: string
  ): HTMLElement {
    const matches = allMatches.filter((match) => match.matches(selector));
    if (matches.length !== 1) {
      const matchDescs = allMatches
        .map((el) => `<${el.nodeName.toLowerCase()}>`)
        .join(", ");
      const cond =
        matches.length === 0 ? "none match" : "more than one matches";
      throw queryHelpers.getElementError(
        `Found at least one element with label text "${matcher}" (${matchDescs}), ` +
          `but ${cond} the selector "${selector}"`,
        this.rr.container
      );
    }
    return matches[0];
  }

  /**
   * Get the one input element matching the given label text *and* selector, raising
   * an error if zero or more than one result is found.
   */
  getByLabelTextAndSelector(
    matcher: RegExp | string,
    selector: string
  ): HTMLElement {
    return this.getMatchFromSelector(
      matcher,
      this.rr.getAllByLabelText(matcher),
      selector
    );
  }

  /**
   * Get the one element matching the given text *and* selector, raising
   * an error if zero or more than one result is found.
   */
  getByTextAndSelector(
    matcher: RegExp | string,
    selector: string
  ): HTMLElement {
    return this.getMatchFromSelector(
      matcher,
      this.rr.getAllByText(matcher),
      selector
    );
  }

  /**
   * Asserts that the link specified by the given matcher has the
   * given `href` attribute.
   */
  ensureLinkGoesTo(matcher: Matcher, href: string) {
    const link = this.rr.getByText(matcher, { selector: "a" });
    expect(link.getAttribute("href")).toBe(href);
  }
}
