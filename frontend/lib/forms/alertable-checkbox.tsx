import React from "react";
import { BooleanFormFieldProps, CheckboxFormField } from "./form-fields";
import { RouteComponentProps, Route, withRouter } from "react-router";

export interface AlertableCheckboxProps extends BooleanFormFieldProps {
  /** The modal to show when the user checks the checkbox. */
  modal: React.ComponentType;

  /** The route that the modal will be shown at. */
  modalPath: string;
}

type AlertableCheckboxPropsWithRouter = AlertableCheckboxProps &
  RouteComponentProps<any>;

export class AlertableCheckboxWithoutRouter extends React.Component<
  AlertableCheckboxPropsWithRouter
> {
  componentDidUpdate(prevProps: AlertableCheckboxPropsWithRouter) {
    if (this.props.value === true && prevProps.value === false) {
      this.props.history.push(this.props.modalPath);
    }
  }

  render() {
    return (
      <CheckboxFormField {...this.props}>
        {this.props.children}
        <Route path={this.props.modalPath} exact component={this.props.modal} />
      </CheckboxFormField>
    );
  }
}

/**
 * A checkbox that shows a modal when the user checks it.
 *
 * The modal will be shown at a route, which the component takes
 * care of registering.
 */
const AlertableCheckbox = withRouter(AlertableCheckboxWithoutRouter);

export default AlertableCheckbox;
