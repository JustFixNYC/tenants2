import React from "react";

export const Accordian = (props: {
  header: String;
  headerClasses?: string;
  children: React.ReactNode;
  contentClasses?: string;
}) => (
  <details className={props.headerClasses || ""}>
    <summary className={props.contentClasses || ""}>{props.header}</summary>
    {props.children}
  </details>
);
