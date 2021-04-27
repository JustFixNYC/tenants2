import React from "react";
import { StaticImage } from "./static-image";

const ChevronIcon = () => (
  <StaticImage ratio="is-16x16" src="frontend/img/chevron.svg" alt="" />
);

export const Accordion = (props: {
  question: string;
  children: React.ReactNode;
  questionClassName?: string;
  extraClassName?: string;
  /** When set to true, the accordion is open on initial view. */
  isExpanded?: boolean;
}) => {
  const extraClassName = props.extraClassName ?? "jf-space-below-2rem";

  return (
    <div className={`jf-accordion-item ${extraClassName}`}>
      <details
        className={`has-text-left ${extraClassName}`}
        open={props.isExpanded}
      >
        <summary>
          <div className="media">
            <div className="media-content">
              <span
                className={
                  props.questionClassName ??
                  "is-size-6 has-text-primary jf-has-text-underline"
                }
              >
                {props.question}
              </span>
            </div>
            <div className="media-right">
              <ChevronIcon />
            </div>
          </div>
        </summary>
        {props.children}
      </details>
    </div>
  );
};
