import React from 'react';
import { BaseFormFieldProps, HiddenFormField, CheckboxFormField } from './form-fields';
import { BaseFormContext } from './form-context';

type FormsetItemInput = {
  /**
   * The formset item's id. It will be falsy if it hasn't yet been saved
   * on the server-side.
   */
  id?: string|null;

  /**
   * Whether to delete the formset item once the form is submitted.
   */
  DELETE: boolean;
};

export type FormsetItemProps = {
  /** Properties from the formset item's 'id' field. */
  idProps: BaseFormFieldProps<string|null|undefined>,
  /** Properties from the formset item's 'DELETE' field. */
  deleteProps: BaseFormFieldProps<boolean>,
  /** The label for the formset item as a whole (e.g. "Todo item #1"). */
  label?: string|JSX.Element,
  /** The children that render the rest of the formset item's fields. */
  children: any
};

/**
 * Retrieve necessary props for the formset item from the given form context.
 * The return value can be passed on to a <FormsetItem> via JSX spread notation.
 */
export function formsetItemProps<T extends FormsetItemInput>(ctx: BaseFormContext<T>): Pick<FormsetItemProps, 'idProps'|'deleteProps'> {
  const idProps = ctx.fieldPropsFor('id');
  const deleteProps = ctx.fieldPropsFor('DELETE');

  return { idProps, deleteProps };
}

/**
 * A component that renders an item in a formset, along with a label/heading
 * and an optional delete button. It also takes care of rendering the item's
 * 'id' as a hidden field.
 */
export function FormsetItem(props: FormsetItemProps) {
  let fields = <>
    <HiddenFormField {...props.idProps} />
    {props.children}
    {props.idProps.value
      ? <CheckboxFormField {...props.deleteProps}>Delete</CheckboxFormField>
      : <HiddenFormField {...props.deleteProps} />}
  </>;
  return <>
    {props.label && <h2 className="subtitle is-5 is-marginless">
      {props.label}
    </h2>}
    {fields}
  </>
}
