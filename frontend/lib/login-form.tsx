import React from 'react';
import { LoginInput } from './queries/globalTypes';

import { FormErrors, ListFieldErrors } from './forms';

interface LoginFormProps {
  onSubmit: (input: LoginInput) => void;
  loginErrors?: FormErrors<LoginInput>;
}

type FormFields = Exclude<keyof LoginInput, 'clientMutationId'>;

type FormInput = {
  [K in FormFields]: LoginInput[K]
};

type LoginFormState = FormInput;

type FormFieldInputType = 'text'|'password';

interface FormFieldMetadata {
  label: string;
  type: FormFieldInputType;
}

type FormFieldMetadataMap<T> = {
  [K in FormFields]: FormFieldMetadata
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

  renderWidget(fieldName: FormFields) {
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
        {this.renderWidget('phoneNumber')}
        {this.renderWidget('password')}
        <p><button type="submit" className="button is-primary">Submit</button></p>
      </form>
    );
  }
}
