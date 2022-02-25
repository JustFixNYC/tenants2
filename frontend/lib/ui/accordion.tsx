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
  /** When defined, this tuple of text replaces the toggle icon with two words,
   * the first word is the text label for opening the accordion and the second is for closing.
   **/
  textLabelsForToggle?: [string, string];
}) => {
  const extraClassName = props.extraClassName ?? "jf-space-below-2rem";
  const { isExpanded, questionClassName, textLabelsForToggle } = props;

  return (
    <div className={`jf-accordion-item ${extraClassName}`}>
      <details className={`has-text-left ${extraClassName}`} open={isExpanded}>
        <summary>
          <div className="media">
            <div className="media-content">
              <span
                className={
                  questionClassName ??
                  "is-size-6 has-text-primary jf-has-text-underline"
                }
              >
                {props.question}
              </span>
            </div>
            <div className="media-right">
              {textLabelsForToggle ? (
                <>
                  <span className="jf-accordion-open-text-label">
                    {textLabelsForToggle[0]}
                  </span>
                  <span className="jf-accordion-close-text-label">
                    {textLabelsForToggle[1]}
                  </span>
                </>
              ) : (
                <ChevronIcon />
              )}
            </div>
          </div>
        </summary>
        {props.children}
      </details>
    </div>
  );
};
