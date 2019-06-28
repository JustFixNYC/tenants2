import React, { FormHTMLAttributes } from 'react';
import autobind from 'autobind-decorator';
import { AriaAnnouncement } from './aria';
import { FormErrors, NonFieldErrors } from './form-errors';
import { FormContext } from './form-context';

export type HTMLFormAttrs = React.DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type FormContextRenderer<FormInput> = (context: FormContext<FormInput>) => JSX.Element;

export interface BaseFormProps<FormInput> {
  isLoading: boolean;
  errors?: FormErrors<FormInput>;
}

export interface FormProps<FormInput> extends BaseFormProps<FormInput> {
  onSubmit: (input: FormInput) => void;
  onChange?: (input: FormInput) => void;
  idPrefix: string;
  initialState: FormInput;
  children: FormContextRenderer<FormInput>;
  extraFields?: JSX.Element;
  extraFormAttributes?: HTMLFormAttrs;
}

/** This class encapsulates view logic for forms. */
export class Form<FormInput> extends React.Component<FormProps<FormInput>, FormInput> {
  constructor(props: FormProps<FormInput>) {
    super(props);
    this.state = props.initialState;
  }

  static defaultProps = {
    idPrefix: ''
  };

  @autobind
  submit() {
    if (!this.props.isLoading) {
      this.props.onSubmit(this.state);
    }
  }

  @autobind
  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.submit();
  }

  componentDidUpdate(prevProps: FormProps<FormInput>, prevState: FormInput) {
    if (prevState !== this.state && this.props.onChange) {
      this.props.onChange(this.state);
    }
  }

  render() {
    let ctx = new FormContext({
      idPrefix: this.props.idPrefix,
      isLoading: this.props.isLoading,
      errors: this.props.errors,
      namePrefix: '',
      currentState: this.state,
      setField: (field, value) => {
        // I'm not sure why Typescript dislikes this, but it seems
        // like the only way to get around it is to cast to "any". :(
        this.setState({ [field]: value } as any);
      }
    }, this.submit);

    return (
      <form {...this.props.extraFormAttributes} onSubmit={this.handleSubmit}>
        {this.props.extraFields}
        {this.props.isLoading && <AriaAnnouncement text="Loading..." />}
        {this.props.errors && <AriaAnnouncement text="Your form submission had errors." />}
        <NonFieldErrors errors={this.props.errors} />
        {this.props.children(ctx)}
        {ctx.logWarnings()}
      </form>
    );
  }
}
