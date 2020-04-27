import React from "react";

export const BreaksBetweenLines: React.FC<{ lines: string | string[] }> = (
  props
) => {
  const strLines =
    typeof props.lines === "string" ? props.lines.split("\n") : props.lines;
  const lines: Array<string | JSX.Element> = [];

  for (let i = 0; i < strLines.length; i++) {
    lines.push(strLines[i]);
    if (i < strLines.length - 1) {
      lines.push(<br key={i} />);
    }
  }

  return <>{lines}</>;
};
