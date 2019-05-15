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
  onCreateFormContext?: (ctx: BaseFormContext<any>) => void;
}

export interface FormsetProps<FormsetInput> extends BaseFormsetProps<FormsetInput> {
  children: FormsetRenderer<FormsetInput>
  emptyForm?: FormsetInput;
}

export type FormsetContext<FormsetInput> = BaseFormContext<FormsetInput>;

export type FormsetRenderer<FormsetInput> = (ctx: FormsetContext<FormsetInput>, index: number) => JSX.Element;

function withItemChanged<T, K extends keyof T>(items: T[], index: number, field: K, value: T[K]): T[] {
  const newItems = items.slice();
  newItems[index] = Object.assign({}, newItems[index]);
  newItems[index][field] = value;
  return newItems;
}

export class Formset<FormsetInput> extends React.Component<FormsetProps<FormsetInput>> {
  render() {
    const { props } = this;
    let { items, errors, name } = props;
    let initialForms = items.length;
    const filterEmpty = (i: typeof items) =>
      props.emptyForm ? i.filter(item => !isDeepEqual(item, props.emptyForm)) : i;

    if (props.emptyForm) {
      items = filterEmpty(items);
      initialForms = items.length;
      items = [...items, props.emptyForm];
    }

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
            onCreateFormContext: props.onCreateFormContext,
            setField: (field, value) => {
              const newItems = filterEmpty(withItemChanged(items, i, field, value));
              props.onChange(newItems);
            }
          });
          return (
            <React.Fragment key={i}>
              <NonFieldErrors errors={itemErrors} />
              {props.children(ctx, i)}
            </React.Fragment>
          );
        })}
      </>
    );
  }
}
