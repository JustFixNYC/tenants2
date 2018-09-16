import * as rt from 'react-testing-library'

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

  /** Click anything with the given text and selector. */
  click(matcher: RegExp|string, selector: string) {
    rt.fireEvent.click(this.rr.getByText(matcher, { selector }));
  }

  /** Click a button or link in the render result. */
  clickButtonOrLink(matcher: RegExp|string) {
    this.click(matcher, 'a, button');
  }

  /** Fill out multiple form fields in the render result. */
  fillFormFields(fills: FormFieldFill[]) {
    fills.forEach(([matcher, value]) => {
      const input = this.rr.getByLabelText(matcher, {
        selector: 'input, select'
      }) as HTMLInputElement;
      input.value = value;
    });
  }

  /** Retrieve a modal dialog with the given label in the render result. */
  getDialogWithLabel(matcher: RegExp|string): HTMLDivElement {
    return this.rr.getByLabelText(matcher, {
      selector: 'div[role="dialog"]'
    }) as HTMLDivElement;
  }

  /** Quick access to rt.cleanup(), which can be used in afterEach() calls. */
  static cleanup() {
    rt.cleanup();
  }
}
