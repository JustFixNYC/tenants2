import React from 'react';
import { FormErrors, NonFieldErrors } from "./form-errors";
import { BaseFormContext } from "./forms";
import { isDeepEqual } from './util';

export interface BaseFormsetProps<FormsetInput> {
  items: FormsetInput[],
  errors?: FormErrors<FormsetInput>[],
  onChange(items: FormsetInput[]): void;
  idPrefix: string;
  isLoading: boolean;
  name: string;
}

export interface FormsetProps<FormsetInput> extends BaseFormsetProps<FormsetInput> {
  children: FormsetRenderer<FormsetInput>
  emptyForm?: FormsetInput;
  maxNum?: number;
  extra?: number;
}

export type FormsetContext<FormsetInput> = BaseFormContext<FormsetInput>;

export type FormsetRenderer<FormsetInput> = (ctx: FormsetContext<FormsetInput>, index: number) => JSX.Element;

function withItemChanged<T, K extends keyof T>(items: T[], index: number, field: K, value: T[K]): T[] {
  const newItems = items.slice();
  newItems[index] = Object.assign({}, newItems[index]);
  newItems[index][field] = value;
  return newItems;
}

function getValueOrDefault<T>(value: T|undefined, defaultValue: T): T {
  return typeof(value) === 'undefined' ? defaultValue : value;
}

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

function removeEmptyFormsAtEnd<T>(items: T[], empty?: T): T[] {
  if (!empty) {
    return items;
  }
  const i = findLatestNonEmptyFormIndex(items, empty);
  return items.slice(0, i + 1);
}

function addEmptyForms<FormsetInput>(options: {
  items: FormsetInput[],
  emptyForm?: FormsetInput,
  maxNum?: number,
  extra?: number
}): { initialForms: number, items: FormsetInput[] } {
  if (options.emptyForm) {
    const extra = getValueOrDefault(options.extra, 1);
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

export class Formset<FormsetInput> extends React.Component<FormsetProps<FormsetInput>> {
  render() {
    const { props } = this;
    const { errors, name } = props;
    const { initialForms, items } = addEmptyForms(props);

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
      </>
    );
  }
}
