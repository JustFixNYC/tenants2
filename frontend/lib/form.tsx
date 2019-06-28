import React, { FormHTMLAttributes } from 'react';
import autobind from 'autobind-decorator';
import { AriaAnnouncement } from './aria';
import { FormErrors, FormError, NonFieldErrors } from './form-errors';
import { BaseFormFieldProps } from './form-fields';
import { BaseFormsetProps } from './formset';

type UnwrappedArray<T> = T extends (infer U)[] ? U : never;

export type HTMLFormAttrs = React.DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export type FormContextRenderer<FormInput> = (context: FormContext<FormInput>) => JSX.Element;

type FieldSetter<FormInput> = {
  <K extends keyof FormInput>(field: K, value: FormInput[K]): void;
};

export interface BaseFormContextOptions<FormInput> {
  idPrefix: string;
  isLoading: boolean;
  errors: FormErrors<FormInput>|undefined;
  currentState: FormInput;
  setField: FieldSetter<FormInput>;
  namePrefix: string;
}

export class BaseFormContext<FormInput> {
  readonly isLoading: boolean;
  protected readonly fieldPropsRequested = new Set<string>();

  constructor(protected readonly options: BaseFormContextOptions<FormInput>) {
    this.isLoading = options.isLoading;
  }

  get nonFieldErrors(): undefined|FormError[] {
    return this.options.errors && this.options.errors.nonFieldErrors;
  }

  fieldPropsFor<K extends (keyof FormInput) & string>(field: K): BaseFormFieldProps<FormInput[K]> {
    const o = this.options;
    const name = `${o.namePrefix}${field}`;
    const ctx: BaseFormFieldProps<FormInput[K]> = {
      onChange(value) {
        o.setField(field, value)
      },
      errors: o.errors && o.errors.fieldErrors[field],
      value: o.currentState[field],
      name,
      id: `${o.idPrefix}${name}`,
      isDisabled: o.isLoading
    };

    this.fieldPropsRequested.add(field);

    return ctx;
  }

  private warnOrThrow(msg: string) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(msg);
    } else {
      throw new Error(msg);
    }
  }

  logWarnings() {
    const { namePrefix } = this.options;
    const nameInfo = namePrefix ? ` with name prefix "${namePrefix}"` : '';

    for (let key in this.options.currentState) {
      if (!this.fieldPropsRequested.has(key)) {
        this.warnOrThrow(
          `Form field "${key}"${nameInfo} may not have been rendered. ` +
          `Please ensure that the field/formsetPropsFor("${key}") method on ` +
          `the relevant form context is called at render time.`
        );
      }
    }
  }
}

export class FormContext<FormInput> extends BaseFormContext<FormInput> {
  constructor(
    options: BaseFormContextOptions<FormInput>,
    readonly submit: () => void
  ) {
    super(options);
  }

  private getFormsetItems<K extends keyof FormInput>(formset: K): UnwrappedArray<FormInput[K]>[] {
    const items = this.options.currentState[formset];
    if (!Array.isArray(items)) {
      throw new Error(`invalid formset '${formset}'`);
    }
    return items;
  }

  formsetPropsFor<K extends (keyof FormInput) & string>(formset: K): BaseFormsetProps<UnwrappedArray<FormInput[K]>> {
    // Urg, due to weirdnesses with our UnwrappedArray type, we need
    // to typecast here.

    const o = this.options;
    const errors: FormErrors<any>[]|undefined =
      o.errors && o.errors.formsetErrors && o.errors.formsetErrors[formset];
    this.fieldPropsRequested.add(formset);

    return {
      items: this.getFormsetItems(formset),
      errors,
      onChange(value) {
        o.setField(formset, value as unknown as FormInput[K]);
      },
      idPrefix: o.idPrefix,
      isLoading: o.isLoading,
      name: formset
    };
  }
}

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
