import React, { useContext } from "react";
import { FormErrors, NonFieldErrors } from "./form-errors";
import { BaseFormContext } from "./form-context";
import { isDeepEqual } from "../util/util";
import { bulmaClasses } from "../ui/bulma";

import { LEGACY_FORMSET_ADD_BUTTON_NAME } from "../../../common-data/forms.json";
import { useProgressiveEnhancement } from "../ui/progressive-enhancement";
import { LegacyFormSubmissionContext } from "./legacy-form-submitter";

export interface BaseFormsetProps<FormsetInput> {
  /**
   * The current state of all the forms in the formset.
   */
  items: FormsetInput[];

  /**
   * The validation errors for each form in the formset.
   */
  errors?: FormErrors<FormsetInput>[];

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

export interface FormsetProps<FormsetInput>
  extends BaseFormsetProps<FormsetInput> {
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
export type FormsetRenderer<FormsetInput> = (
  ctx: FormsetContext<FormsetInput>,
  index: number
) => JSX.Element;

/**
 * Given an array of objects, returns an array with one of the
 * fields of one of the entries changed.
 */
function withItemChanged<T, K extends keyof T>(
  items: T[],
  index: number,
  field: K,
  value: T[K]
): T[] {
  const newItems = items.slice();
  newItems[index] = Object.assign({}, newItems[index]);
  newItems[index][field] = value;
  return newItems;
}

/**
 * Given an object that may be undefined, return either
 * the object (if it's not undefined) or the given default value.
 */
function getValueOrDefault<T>(value: T | undefined, defaultValue: T): T {
  return typeof value === "undefined" ? defaultValue : value;
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
function getExtra({
  extra,
  isMounted,
}: {
  extra?: number;
  isMounted?: boolean;
}) {
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
  items: FormsetInput[];
  emptyForm?: FormsetInput;
  maxNum?: number;
  extra?: number;
  isMounted?: boolean;
}): { initialForms: number; items: FormsetInput[] } {
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

function AddButton(props: {}) {
  return (
    <div className="field">
      {/**
       * Ugh, we need to insert an "invisible" submit button here to make it the default
       * instead of the add button, in case the user presses enter. Unfortunately this
       * might end up confusing screen reader users, but hopefully not.
       */}
      <input
        type="submit"
        value="Submit form"
        className="jf-sr-only"
        tabIndex={-1}
      />
      <input
        type="submit"
        name={LEGACY_FORMSET_ADD_BUTTON_NAME}
        className={bulmaClasses("button")}
        value="Add another"
      />
    </div>
  );
}

/**
 * If we're responding to a legacy POST, look at the previous POST data
 * to determine how many extra forms to show. Otherwise, just return the
 * default number of extra forms.
 */
function useExtraFromLegacyPOST(
  options: Pick<FormsetProps<any>, "extra" | "items" | "emptyForm"> & {
    totalFormsName: string;
  }
): number | undefined {
  const legacyCtx = useContext(LegacyFormSubmissionContext);
  if (
    legacyCtx &&
    legacyCtx.POST[LEGACY_FORMSET_ADD_BUTTON_NAME] &&
    options.emptyForm
  ) {
    const prevNonEmptyForms =
      findLatestNonEmptyFormIndex(options.items, options.emptyForm) + 1;
    const prevTotalForms = parseInt(
      legacyCtx.POST[options.totalFormsName] || ""
    );
    if (prevTotalForms >= prevNonEmptyForms) {
      return prevTotalForms - prevNonEmptyForms + 1;
    }
  }

  return options.extra;
}

/**
 * A "formset" is a term taken from Django and refers to an array
 * of forms (e.g., the items in a to-do list).
 */
export function Formset<FormsetInput>(props: FormsetProps<FormsetInput>) {
  const { errors, name } = props;
  const totalFormsName = `${name}-TOTAL_FORMS`;
  const isMounted = useProgressiveEnhancement();
  const extra = useExtraFromLegacyPOST({ ...props, totalFormsName });
  const { initialForms, items } = addEmptyForms({ ...props, isMounted, extra });
  const canAddAnother = items.length < (props.maxNum || Infinity);

  return (
    <>
      <input type="hidden" name={totalFormsName} value={items.length} />
      <input
        type="hidden"
        name={`${name}-INITIAL_FORMS`}
        value={initialForms}
      />
      {items.map((item, i) => {
        const itemErrors = errors && errors[i];
        const ctx = new BaseFormContext({
          idPrefix: props.idPrefix,
          isLoading: props.isLoading,
          errors: itemErrors,
          namePrefix: `${name}-${i}-`,
          currentState: item,
          setField: (field, value) => {
            const newItems = removeEmptyFormsAtEnd(
              withItemChanged(items, i, field, value),
              props.emptyForm
            );
            props.onChange(newItems);
          },
        });
        return (
          <React.Fragment key={i}>
            <NonFieldErrors errors={itemErrors} />
            {props.children(ctx, i)}
            {ctx.logWarnings()}
          </React.Fragment>
        );
      })}
      {!isMounted && canAddAnother && <AddButton />}
    </>
  );
}

/**
 * A formset to use when we know there's only one possible entry
 * for the formset.
 */
export function SingletonFormset<FormsetInput extends { id?: string | null }>(
  props: Omit<FormsetProps<FormsetInput>, "maxNum" | "extra">
) {
  return (
    <Formset {...props} maxNum={1} extra={0}>
      {(formsetCtx, i) => {
        // Singleton formset inputs don't care about 'id' properties because
        // the server automatically takes care of them. However, if a legacy
        // POST submission has form errors, we'll get an assertion failure
        // if we don't at least get information about this field, since
        // the rest of the form system will assume it needs to be rendered.
        formsetCtx.fieldPropsFor("id");

        return <>{props.children(formsetCtx, i)}</>;
      }}
    </Formset>
  );
}
