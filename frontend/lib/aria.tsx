import React from 'react';
import autobind from 'autobind-decorator';
import { Omit } from './util';

const KEY_ENTER = 13;
const KEY_SPACE = 32;

function trapEnterOrSpace(e: React.KeyboardEvent): boolean {
  if (e.which === KEY_ENTER || e.which === KEY_SPACE) {
    e.preventDefault();
    return true;
  }
  return false;
}

export function ariaBool(value: boolean): 'true'|'false' {
  return value ? 'true' : 'false';
}

export interface AriaExpandableButtonProps {
  className?: string;
  'aria-label'?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children?: any;
}

export function AriaExpandableButton(props: AriaExpandableButtonProps): JSX.Element {
  return (
    <a className={props.className}
       role="button"
       aria-label={props['aria-label']}
       aria-expanded={ariaBool(props.isExpanded)}
       tabIndex={0}
       onClick={props.onToggle}
       onKeyDown={(e) => { if (trapEnterOrSpace(e)) props.onToggle(); }}
    >{props.children}</a>
  );
}

interface AriaAnnouncerProps {
  children: any;
}

interface AriaAnnouncerState {
  announcement: string;
}

export class AriaAnnouncer extends React.Component<AriaAnnouncerProps, AriaAnnouncerState> {
  constructor(props: AriaAnnouncerProps) {
    super(props);
    this.state = { announcement: '' };
  }

  @autobind
  handleAnnouncement(announcement: string) {
    this.setState(state => ({ announcement }));
  }

  render() {
    return (
      <AriaContext.Provider value={{ announce: this.handleAnnouncement }}>
        <div className="jf-sr-only" role="alert" aria-live="polite">
          {this.state.announcement}
        </div>
        {this.props.children}
      </AriaContext.Provider>
    );
  }
}

interface AriaContextType {
  announce: (text: string) => void;
}

export const AriaContext = React.createContext<AriaContextType>({
  announce(text: string) {}
});

function withAriaContext<P extends AriaContextType>(Component: React.ComponentType<P>): React.ComponentType<Omit<P, keyof AriaContextType>> {
  return function(props: Omit<P, keyof AriaContextType>) {
    return (
      <AriaContext.Consumer>
        {(context) => <Component {...props} announce={context.announce} />}
      </AriaContext.Consumer>
    );
  }
}

interface AriaAnnouncementProps extends AriaContextType {
  text: string;
}

class AriaAnnouncementWithoutContext extends React.Component<AriaAnnouncementProps> {
  componentDidMount() {
    this.props.announce(this.props.text);
  }

  componentDidUpdate(prevProps: AriaAnnouncementProps) {
    if (prevProps.text !== this.props.text) {
      this.props.announce(this.props.text);
    }
  }

  render() {
    return null;
  }
}

export const AriaAnnouncement = withAriaContext(AriaAnnouncementWithoutContext);
