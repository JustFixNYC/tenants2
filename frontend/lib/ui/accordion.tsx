import React from "react";
import { StaticImage } from "./static-image";

const ChevronIcon = () => (
  <StaticImage ratio="is-16x16" src="frontend/img/chevron.svg" alt="" />
);

export const Accordion = (props: {
  question: string;
  children: React.ReactNode;
  questionClassName?: string;
}) => (
  <div className="jf-accordion-item jf-space-below-2rem">
    <details className="has-text-left jf-space-below-2rem">
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
