import React from 'react';

export function i18n(str: string, tagName?: string): string|JSX.Element {
  if (tagName === 'title') {
    return str;
  }
  return <span style={{
    backgroundColor: 'pink',
    border: '1px solid green'
  }}>{str}</span>;
}
