import React from 'react';
import { ServerFormFieldError } from "../form-errors";
import { FormContext } from "../form-context";
import { TextualFormField } from '../form-fields';

export type MyFormOutput = {
  errors: ServerFormFieldError[],
  session: string
};

export type MyFormInput = {
  phoneNumber: string,
  password: string
};

export const myInitialState: MyFormInput = { phoneNumber: '', password: '' };

export const renderMyFormFields = (ctx: FormContext<MyFormInput>) => <>
  <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
  <TextualFormField label="Password" type="password" {...ctx.fieldPropsFor('password')} />
</>;
