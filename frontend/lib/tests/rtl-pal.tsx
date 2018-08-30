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
  rt: typeof rt;

  constructor(readonly rr: rt.RenderResult) {
    this.rt = rt;
  }

  /** Click a button or link in the render result. */
  clickButtonOrLink(matcher: RegExp|string) {
    rt.fireEvent.click(this.rr.getByText(matcher, {
      selector: 'a, button'
    }));
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

  /** Create a testing pal from the given JSX. */
  static render(el: JSX.Element): ReactTestingLibraryPal {
    return new ReactTestingLibraryPal(rt.render(el));
  }

  /** Quick access to rt.cleanup(), which can be used in afterEach() calls. */
  static cleanup() {
    rt.cleanup();
  }
}
