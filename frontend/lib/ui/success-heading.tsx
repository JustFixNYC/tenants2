import React from "react";
import { HeadingRenderer } from "./page";

const checkCircleSvg = require("../svg/check-circle-solid.svg") as JSX.Element;

export const renderSuccessHeading: HeadingRenderer = (title) => (
  <h1 className="jf-heading-with-icon">
    <i className="has-text-success">{checkCircleSvg}</i>
    <span>{title}</span>
  </h1>
);
