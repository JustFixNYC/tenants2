import React from "react";
import classnames from "classnames";

export type BigListProps = {
  /** The list items. */
  children: JSX.Element[];

  /** The ol list element will be given this class, if provided. */
  listClassName?: string;

  /** The content of each list item will be given this class, if provided. */
  itemClassName?: string;
};

/**
 * An ordered list with very big numbers.
 *
 * Each child should be a `<li>` without any props other than children and,
 * optionally, a `key`.
 */
export function BigList(props: BigListProps) {
  return (
    <ol className={classnames("jf-biglist", props.listClassName)}>
      {React.Children.map(props.children, (child, i) => (
        <li key={child.key === null ? i : child.key}>
          <div className="jf-biglist-counter" />
          <div className={props.itemClassName}>{child.props.children}</div>
        </li>
      ))}
    </ol>
  );
}
