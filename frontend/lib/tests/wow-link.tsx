import React from 'react';

export function WhoOwnsWhatLink(props: {bbl: string, children: any}): JSX.Element {
  return <a
    href={`https://whoownswhat.justfix.nyc/bbl/${props.bbl}`}
    target="_blank"
    rel="noopener noreferrer"
  >{props.children}</a>;
}
