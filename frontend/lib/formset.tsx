import React from 'react';
import { FormErrors, NonFieldErrors } from "./form-errors";
import { BaseFormContext } from "./form-context";
import { isDeepEqual } from './util';
import { bulmaClasses } from './bulma';

export interface BaseFormsetProps<FormsetInput> {
  /**
   * The current state of all the forms in the formset.
   */
  items: FormsetInput[],

  /**
   * The validation errors for each form in the formset.
   */
  errors?: FormErrors<FormsetInput>[],

  /** 
   * This function is called whenever any of the forms
   * in the formset change.
   */
  onChange(items: FormsetInput[]): void;

  /**
   * This optional prefix is given to any `id` attributes that are
   * ultimately created for fields in the formset.
   */
  idPrefix: string;

  /**
   * Whether the formset's parent form has been submitted and is
   * currently waiting for a response.
   */
  isLoading: boolean;

  /**
   * The name of the formset. This should be a key of the input
   * of the formset's parent form.
   */
  name: string;
}

export interface FormsetProps<FormsetInput> extends BaseFormsetProps<FormsetInput> {
  /**
   * A render prop that is called once for each form in the formset. It
   * is responsible for rendering the form's fields.
   */
  children: FormsetRenderer<FormsetInput>;

  /**
   * An object that represents an empty form for the formset,
   * used when presenting the user with a blank form that
   * represents a new entry to the formset.
   */
  emptyForm?: FormsetInput;

  /**
   * The maximum number of forms in the formset.
   */
  maxNum?: number;

  /**
   * The number of extra blank forms to show at the end of
   * the existing forms in the formset.
   */
  extra?: number;
}

/**
 * A class that encapsulates data and functionality needed to
 * render a formset form's fields.
 */
export type FormsetContext<FormsetInput> = BaseFormContext<FormsetInput>;

/**
 * This function type is responsible for rendering a single formset
 * form.
 */
export type FormsetRenderer<FormsetInput> = (ctx: FormsetContext<FormsetInput>, index: number) => JSX.Element;

/**
 * Given an array of objects, returns an array with one of the
 * fields of one of the entries changed.
 */
function withItemChanged<T, K extends keyof T>(items: T[], index: number, field: K, value: T[K]): T[] {
  const newItems = items.slice();
  newItems[index] = Object.assign({}, newItems[index]);
  newItems[index][field] = value;
  return newItems;
}

/**
 * Given an object that may be undefined, return either
 * the object (if it's not undefined) or the given default value.
 */
function getValueOrDefault<T>(value: T|undefined, defaultValue: T): T {
  return typeof(value) === 'undefined' ? defaultValue : value;
}

/**
 * Find the last index of a formset's forms that does not represent
 * a blank form.
 */
function findLatestNonEmptyFormIndex<T>(items: T[], empty: T): number {
  let i = items.length - 1;

  while (i >= 0) {
    const item = items[i];
    if (!isDeepEqual(item, empty)) {
      return i;
    }
    i--;
  }

  return -1;
}

/** Remove the empty forms at the end of a formset. */
export function removeEmptyFormsAtEnd<T>(items: T[], empty?: T): T[] {
  if (!empty) {
    return items;
  }
  const i = findLatestNonEmptyFormIndex(items, empty);
  return items.slice(0, i + 1);
}

/**
 * Return the number of extra blank forms to show at the end
 * of a formset, if any.
 */
function getExtra({ extra, isMounted }: { extra?: number, isMounted?: boolean }) {
  const base = getValueOrDefault(extra, 1);
  if (isMounted) {
    // If we're progressively-enhanced, show at most one extra form.
    return Math.min(base, 1);
  }
  return base;
}

/**
 * Potentially add empty/blank forms to the given list of
 * formset forms.
 */
export function addEmptyForms<FormsetInput>(options: {
  items: FormsetInput[],
  emptyForm?: FormsetInput,
  maxNum?: number,
  extra?: number,
  isMounted?: boolean
}): { initialForms: number, items: FormsetInput[] } {
  if (options.emptyForm) {
    const extra = getExtra(options);
    const maxNum = getValueOrDefault(options.maxNum, Infinity);
    const items = removeEmptyFormsAtEnd(options.items, options.emptyForm);
    const initialForms = items.length;
    for (let i = 0; i < extra && items.length < maxNum; i++) {
      items.push(options.emptyForm);
    }
    return { initialForms, items };
  }
  const { items } = options;
  const initialForms = items.length;
  return { initialForms, items };
}

type State = {
  /** Whether or not the component has been mounted to the DOM. */
  isMounted: boolean
};

/**
 * A "formset" is a term taken from Django and refers to an array
 * of forms (e.g., the items in a to-do list).
 */
export class Formset<FormsetInput> extends React.Component<FormsetProps<FormsetInput>, State> {
  constructor(props: FormsetProps<FormsetInput>) {
    super(props);
    this.state = { isMounted: false };
  }

  componentDidMount() {
    this.setState({ isMounted: true });
  }

  render() {
    const { props } = this;
    const { isMounted } = this.state;
    const { errors, name } = props;
    const { initialForms, items } = addEmptyForms({ ...props, isMounted });
    const canAddAnother = items.length < (props.maxNum || Infinity);

    return (
      <>
        <input type="hidden" name={`${name}-TOTAL_FORMS`} value={items.length} />
        <input type="hidden" name={`${name}-INITIAL_FORMS`} value={initialForms} />
        {items.map((item, i) => {
          const itemErrors = errors && errors[i];
          const ctx = new BaseFormContext({
            idPrefix: props.idPrefix,
            isLoading: props.isLoading,
            errors: itemErrors,
            namePrefix: `${name}-${i}-`,
            currentState: item,
            setField: (field, value) => {
              const newItems = removeEmptyFormsAtEnd(withItemChanged(items, i, field, value), props.emptyForm);
              props.onChange(newItems);
            }
          });
          return (
            <React.Fragment key={i}>
              <NonFieldErrors errors={itemErrors} />
              {props.children(ctx, i)}
              {ctx.logWarnings()}
            </React.Fragment>
          );
        })}
        {!isMounted && canAddAnother && <div className="field"><input type="submit" name="legacyFormsetAddButton" className={bulmaClasses('button')} value="Add another" /></div>}
      </>
    );
  }
}
