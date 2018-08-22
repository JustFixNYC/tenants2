import React from 'react';

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
  className: string;
  'aria-label'?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: any;
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
