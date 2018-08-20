import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { FormErrors, ListFieldErrors } from './forms';

interface LoginFormProps {
  onSubmit: (input: LoginInput) => void;
  loginErrors?: FormErrors<LoginInput>;
}

/** Get just the keys of a type whose values are strings. */
type StringPropNames<T> = NonNullable<{ [K in keyof T]: T[K] extends string ? K : never }[keyof T]>;

/** Narrow a mapping to include only its string values. */
type StringProps<T> = {
  [K in StringPropNames<LoginInput>]: string;
}

/**
 * A union of form field names that are actually capable of
 * being filled out by users.
 **/
type FillableFormFields<T> = Exclude<keyof T, 'clientMutationId'>;

/**
 * A version of a GraphQL form input type that contains only
 * the fields users fill out.
 */
type FillableFormInput<T> = {
  [K in FillableFormFields<T>]: T[K]
};

/**
 * Valid values that can be passed as the "type" attribute
 * for <input> fields.
 */
type FormFieldInputType = 'text'|'password';

/**
 * Metadata for form fields in a form.
 */
interface FormFieldMetadata {
  label: string;
  type: FormFieldInputType;
}

type FormFieldMetadataMap<T> = {
  [K in FillableFormFields<T>]: FormFieldMetadata
};

const LOGIN_FIELD_METADATA: FormFieldMetadataMap<LoginInput> = {
  phoneNumber: {
    label: 'Phone number',
    type: 'password'
  },
  password: {
    label: 'Password',
    type: 'text'
  }
};

export class LoginForm extends React.Component<LoginFormProps, FillableFormInput<LoginInput>> {
  constructor(props: LoginFormProps) {
    super(props);
    this.state = { phoneNumber: '', password: '' };
  }

  renderTextualWidget(fieldName: FillableFormFields<StringProps<LoginInput>>) {
    const errors = this.props.loginErrors;
    const meta = LOGIN_FIELD_METADATA[fieldName];

    return (
      <div>
        <p>
          <input
            className="input"
            type={meta.type}
            placeholder={meta.label}
            value={this.state[fieldName]}
            onChange={(e) => {
              const value = e.target.value;
              // We really shouldn't have to provide a full state here,
              // but TypeScript complains if we attempt to provide a
              // partial one. :(
              this.setState(state => ({
                ...state,
                [fieldName]: value
              }));
            }}
          />
        </p>
        <ListFieldErrors errors={errors && errors.fieldErrors[fieldName]} />
      </div>
    );
  }

  render() {
    const errors = this.props.loginErrors;

    return (
      <form onSubmit={(event) => {
        event.preventDefault();
        this.props.onSubmit(this.state);
      }}>
        <ListFieldErrors errors={errors && errors.nonFieldErrors} />
        {this.renderTextualWidget('phoneNumber')}
        {this.renderTextualWidget('password')}
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
