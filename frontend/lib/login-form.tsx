import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { FormErrors, ListFieldErrors } from './forms';


interface LoginFormProps {
  onSubmit: (input: LoginInput) => void;
  loginErrors?: FormErrors<LoginInput>;
}

type LoginFormState = LoginInput;

type FormFieldInputType = 'text'|'password';

interface FormFieldMetadata {
  label: string;
  type: FormFieldInputType;
}

type FormFieldMetadataMap<T> = {
  [K in keyof T]: FormFieldMetadata
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

export class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props: LoginFormProps) {
    super(props);
    this.state = { phoneNumber: '', password: '' };
  }

  renderWidget(fieldName: keyof LoginInput) {
    const errors = this.props.loginErrors;
    const meta = LOGIN_FIELD_METADATA[fieldName];

    if (!meta) {
      // TODO: Argh, we shouldn't have to do this, our type system
      // should elimiate the possibility.
      throw new Error(`Assertion failure, no metadata for "${fieldName}"`);
    }

    return (
      <div>
        <p>
          <input
            className="input"
            type={meta.type}
            // TODO: We should use a <label>, not a placeholder.
            placeholder={meta.label}
            // TODO: Ugh, figure out how to not have to typecast to any here.
            value={this.state[fieldName] as any}
            // TODO: Ugh, figure out how to not have to typecast to any here.
            onChange={(e) => { this.setState({ [fieldName]: e.target.value } as any); }}
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
        {this.renderWidget('phoneNumber')}
        {this.renderWidget('password')}
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
