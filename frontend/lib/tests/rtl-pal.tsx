import * as rt from '@testing-library/react'
import { getElement } from '../util';

/**
 * A type for expressing how to fill out a form field.
 * 
 * The first element of the tuple is the matcher for the
 * form field, while the second is the value to set the
 * form field to.
 */
export type FormFieldFill = [RegExp|string, string];

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
    selector: string
  ): HTMLElementTagNameMap[K] {
    return getElement(tagName, selector, this.rr.baseElement);
  }

  /** Click anything with the given text and selector. */
  click(matcher: RegExp|string, selector: string) {
    rt.fireEvent.click(this.rr.getByText(matcher, { selector }));
  }

  /** Click a list item in the render result. */
  clickListItem(matcher: RegExp|string) {
    this.click(matcher, 'li');
  }

  /** Click a button or link in the render result. */
  clickButtonOrLink(matcher: RegExp|string) {
    this.click(matcher, 'a, button, a > .jf-sr-only, button > .jf-sr-only');
  }

  /** Click a radio button or checkbox in the render result. */
  clickRadioOrCheckbox(matcher: RegExp|string) {
    rt.fireEvent.click(this.rr.getByLabelText(matcher, {
      selector: 'input'
    }));
  }

  /**
   * Return a form field (e.g. an <input> or <select>) in the render result,
   * given label text or a regular expression matching the label text.
   */
  getFormField(label: string|RegExp): HTMLInputElement {
    return this.rr.getAllByLabelText(label, {
      selector: 'input, select'
    })[0] as HTMLInputElement;
  }

  /** Send a keyDown event to the given form field with the give key code. */
  keyDownOnFormField(label: string|RegExp, keyCode: number) {
    rt.fireEvent.keyDown(this.getFormField(label), { keyCode });
  }

  /** Fill out multiple form fields in the render result. */
  fillFormFields(fills: FormFieldFill[]) {
    fills.forEach(([matcher, value]) => {
      const input = this.getFormField(matcher);
      rt.fireEvent.change(input, { target: { value } });
    });
  }

  /** Retrieve a modal dialog with the given label in the render result. */
  getDialogWithLabel(matcher: RegExp|string): HTMLDivElement {
    return this.rr.getAllByLabelText(matcher, {
      selector: 'div[role="dialog"]'
    })[0] as HTMLDivElement;
  }

  /** Quick access to rt.cleanup(), which can be used in afterEach() calls. */
  static cleanup() {
    rt.cleanup();
  }
}
