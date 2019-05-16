import React from 'react';
import autobind from 'autobind-decorator';
import { KEY_ENTER, KEY_SPACE } from './key-codes';
import { buildContextHocFactory } from './context-util';

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

/**
 * An announcer to vocalize text to screen reader users, to provide
 * context for what's going on.
 */
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

export const withAriaContext = buildContextHocFactory(AriaContext);

interface AriaAnnouncementProps extends AriaContextType {
  text: string;
}

export class AriaAnnouncementWithoutContext extends React.Component<AriaAnnouncementProps> {
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
