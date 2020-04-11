import React, { FormHTMLAttributes } from 'react';
import autobind from 'autobind-decorator';
import { AriaAnnouncement } from '../ui/aria';
import { FormErrors, NonFieldErrors } from './form-errors';
import { FormContext } from './form-context';

/** This is just shorthand for the attributes of a <form> element. */
export type HTMLFormAttrs = React.DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

/**
 * This function type is responsible for rendering a form's fields,
 * including its submit button.
 */
export type FormContextRenderer<FormInput, FormOutput> = (context: FormContext<FormInput>, latestOutput?: FormOutput) => JSX.Element;

export interface BaseFormProps<FormInput> {
  /**
   * Whether the form has been submitted and is currently waiting
   * for a response from e.g. a server.
   */
  isLoading: boolean;

  /**
   * Any validation errors related to the form submission. Note that
   * this should either be undefined or an array containing at least
   * one element; it should *never* be an empty array.
   */
  errors?: FormErrors<FormInput>;
}

type State<FormInput> = {
  current: FormInput,
  initial: FormInput,
};

export interface FormProps<FormInput, FormOutput> extends BaseFormProps<FormInput> {
  /**
   * This function is called when the user submits the form.
   */
  onSubmit: (input: FormInput) => void;

  /**
   * This function is called whenever the user changes their
   * form input in any way.
   */
  onChange?: (input: FormInput) => void;

  /**
   * This optional prefix is given to any `id` attributes that are
   * ultimately created for fields or anything else within the
   * form that needs an identifier that is unique within the whole
   * page.
   */
  idPrefix?: string;

  /** 
   * The initial state of the form's input (what the form's fields
   * are initially populated with).
   */
  initialState: FormInput;

  /**
   * If provided, this will be called when the component mounts to
   * update the initial state on the browser-side. It can be used to
   * e.g. pre-fill the default value of a form field from local
   * browser storage without causing hydration mismatches due to
   * conflicts between initial renders on the server and client.
   */
  updateInitialStateInBrowser?: (initialState: FormInput) => FormInput;

  /**
   * Optional callback to call when we update the initial state on
   * the browser-side.
   */
  onUpdateInitialState?: (initialState: FormInput) => void;

  /**
   * The child render prop for the form, which is responsible
   * for rendering the form's fields and any other content.
   */
  children: FormContextRenderer<FormInput, FormOutput>;

  /**
   * Any extra form fields to include in the form, apart from
   * the ones rendered by the children. This can be useful for
   * rendering hidden fields and other "bookkeeping" that may
   * be used by the server.
   */
  extraFields?: JSX.Element;

  /**
   * Any extra attributes that will be added to the <form> element
   * rendered by the component.
   */
  extraFormAttributes?: HTMLFormAttrs;

  /**
   * The latest server response to the most recent form submission, if any.
   * This is passed on to the child render prop so it can e.g. display
   * a success message if needed.
   */
  latestOutput?: FormOutput;
}

/**
 * This class encapsulates view logic for forms.
 * 
 * It is responsible for:
 * 
 *   * Maintaining the current state of the form's fields (e.g., what
 *     the user has typed so far).
 * 
 *   * Rendering any errors that aren't related to specific fields
 *     in the form.
 * 
 *   * Delegating the rendering of form fields to the child render prop.
 * 
 *   * Ensuring that the child render prop renders all form fields.
 * 
 * It is *not* responsible for actually submitting the form to a
 * server.
 */
export class Form<FormInput, FormOutput> extends React.Component<FormProps<FormInput, FormOutput>, State<FormInput>> {
  constructor(props: FormProps<FormInput, FormOutput>) {
    super(props);
    this.state = {
      current: props.initialState,
      initial: props.initialState
    };
  }

  @autobind
  submit(force: boolean = false) {
    if (!this.props.isLoading || force === true) {
      this.props.onSubmit(this.state.current);
    }
  }

  @autobind
  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.submit();
  }

  componentDidMount() {
    let { updateInitialStateInBrowser } = this.props;
    if (updateInitialStateInBrowser) {
      const newState = updateInitialStateInBrowser(this.state.initial);
      this.setState({
        current: newState,
        initial: newState
      });
    }
  }

  componentDidUpdate(prevProps: FormProps<FormInput, FormOutput>, prevState: State<FormInput>) {
    if (prevState.current !== this.state.current && this.props.onChange) {
      this.props.onChange(this.state.current);
    }
  }

  render() {
    let ctx = new FormContext({
      idPrefix: this.props.idPrefix || '',
      isLoading: this.props.isLoading,
      errors: this.props.errors,
      namePrefix: '',
      currentState: this.state.current,
      setField: (field, value) => this.setState(s => ({
        ...s,
        current: {
          ...s.current,
          [field]: value,
        }
      })),
    }, this.submit);

    return (
      <form {...this.props.extraFormAttributes} onSubmit={this.handleSubmit}>
        {this.props.extraFields}
        {this.props.isLoading && <AriaAnnouncement text="Loading..." />}
        {this.props.errors && <AriaAnnouncement text="Your form submission had errors." />}
        <NonFieldErrors errors={this.props.errors} />
        {this.props.children(ctx, this.props.latestOutput)}
        {ctx.logWarnings()}
      </form>
    );
  }
}
