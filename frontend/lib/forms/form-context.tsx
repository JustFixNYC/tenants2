import { FormErrors, FormError } from "./form-errors";
import { BaseFormFieldProps } from "./form-fields";
import { BaseFormsetProps } from "./formset";

/** A helper type that infers the type of elements of an array. */
type UnwrappedArray<T> = T extends (infer U)[] ? U : never;

/** A callable for setting a field of a form to a value. */
type FieldSetter<FormInput> = {
  <K extends keyof FormInput>(field: K, value: FormInput[K]): void;
};

export interface BaseFormContextOptions<FormInput> {
  idPrefix: string;
  isLoading: boolean;
  errors: FormErrors<FormInput> | undefined;
  currentState: FormInput;
  setField: FieldSetter<FormInput>;
  namePrefix: string;
}

/**
 * A class that encapsulates data and functionality needed to
 * render form fields.
 *
 * Note that while this class has `Context` in its name, it
 * is not a React Context. It is instead expected to be explicitly
 * passed as an argument to a render prop.
 */
export class BaseFormContext<FormInput> {
  /**
   * Whether the form has been submitted and is currently waiting
   * for a response from e.g. a server.
   */
  readonly isLoading: boolean;

  /**
   * Book-keeping that is meant to track what fields have
   * been rendered so far.
   */
  protected readonly fieldPropsRequested = new Set<string>();

  constructor(readonly options: BaseFormContextOptions<FormInput>) {
    this.isLoading = options.isLoading;
  }

  /**
   * Return all form validation errors that aren't errors for specific
   * form fields.
   */
  get nonFieldErrors(): undefined | FormError[] {
    return this.options.errors && this.options.errors.nonFieldErrors;
  }

  /**
   * Return the base form field props for a particular field. These
   * can be included in form field components via JSX spread
   * notation.
   *
   * This method also indirectly tracks what form fields have
   * been rendered: while calling this method doesn't *guarantee*
   * that a field has actually been rendered, it is a decent
   * predictor, since calling this method is a prerequisite for
   * rendering a field. It's also very important for us to
   * make sure all form fields are rendered, because legacy POST
   * form submisisons won't work otherwise.
   *
   * A particular wrinkle in this usage is that this method needs
   * to be called for all fields by the component that is passed
   * the form context object, and *not* by child components, due
   * to the asynchronous nature of rendering in React.
   */
  fieldPropsFor<K extends keyof FormInput & string>(
    field: K
  ): BaseFormFieldProps<FormInput[K]> {
    const o = this.options;
    const name = `${o.namePrefix}${field}`;
    const ctx: BaseFormFieldProps<FormInput[K]> = {
      onChange(value) {
        o.setField(field, value);
      },
      errors: o.errors && o.errors.fieldErrors[field],
      value: o.currentState[field],
      name,
      id: `${o.idPrefix}${name}`,
      isDisabled: o.isLoading,
    };

    this.fieldPropsRequested.add(field);

    return ctx;
  }

  /**
   * Log a warning if we're in production, but throw an exception
   * if we're in development.
   */
  private warnOrThrow(msg: string) {
    if (process.env.NODE_ENV === "production") {
      console.warn(msg);
    } else {
      throw new Error(msg);
    }
  }

  /**
   * Check to make sure all form fields were rendered, and if not,
   * log a warning (or throw an error if in development mode).
   */
  logWarnings() {
    const { namePrefix } = this.options;
    const nameInfo = namePrefix ? ` with name prefix "${namePrefix}"` : "";

    for (let key in this.options.currentState) {
      if (!this.fieldPropsRequested.has(key)) {
        this.warnOrThrow(
          `Form field "${key}"${nameInfo} may not have been rendered. ` +
            `Please ensure that the field/formsetPropsFor("${key}") method on ` +
            `the relevant form context is called at render time.`
        );
      }
    }
  }
}

/**
 * A class that encapsulates data and functionality needed to
 * render form fields and formsets.
 *
 * Note that while this class has `Context` in its name, it
 * is not a React Context. It is instead expected to be explicitly
 * passed as an argument to a render prop.
 */
export class FormContext<FormInput> extends BaseFormContext<FormInput> {
  constructor(
    options: BaseFormContextOptions<FormInput>,
    /** A function that is called when the user submits the form. */
    readonly submit: (force?: boolean) => void
  ) {
    super(options);
  }

  private getFormsetItems<K extends keyof FormInput>(
    formset: K
  ): UnwrappedArray<FormInput[K]>[] {
    const items = this.options.currentState[formset];
    if (!Array.isArray(items)) {
      throw new Error(`invalid formset '${formset}'`);
    }
    return items;
  }

  /**
   * Retrieves the props for a particular formset in the form,
   * which can be passed on to a `<Formset>` component via JSX
   * spread notation.
   *
   * Analogous to `fieldPropsFor`, this method keeps track of what
   * formsets it has been called with, and uses them as a proxy
   * to keep track of whether a form's formsets have been rendered.
   */
  formsetPropsFor<K extends keyof FormInput & string>(
    formset: K
  ): BaseFormsetProps<UnwrappedArray<FormInput[K]>> {
    // Urg, due to weirdnesses with our UnwrappedArray type, we need
    // to typecast here.

    const o = this.options;
    const errors: FormErrors<any>[] | undefined =
      o.errors && o.errors.formsetErrors && o.errors.formsetErrors[formset];
    this.fieldPropsRequested.add(formset);

    return {
      items: this.getFormsetItems(formset),
      errors,
      onChange(value) {
        o.setField(formset, (value as unknown) as FormInput[K]);
      },
      idPrefix: o.idPrefix,
      isLoading: o.isLoading,
      name: formset,
    };
  }
}
