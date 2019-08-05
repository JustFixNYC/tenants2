import React from 'react';

export function BigList(props: {children: JSX.Element[], itemClassName?: string}) {
  return (
    <ol className="jf-biglist">
      {React.Children.map(props.children, (child, i) => (
        <li key={child.key === null ? i : child.key}>
          <div className="jf-biglist-counter"/>
          <div className={props.itemClassName}>{child.props.children}</div>
        </li>
      ))}
    </ol>
  );
}
