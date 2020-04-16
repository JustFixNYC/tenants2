import React from "react";

export const LetterPreview: React.FC<{
  title: string;
  src: string;
}> = ({ title, src }) => (
  <div className="box has-text-centered jf-letter-preview">
    <iframe scrolling="no" title={title} src={src}></iframe>
  </div>
);
