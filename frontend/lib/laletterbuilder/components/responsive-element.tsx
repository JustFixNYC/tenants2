import React from "react";
import classnames from "classnames";

type ResponsiveElementTagName = "h1" | "h2" | "h3" | "h4" | "p";

type ResponsiveElementInfo = {
  desktop: ResponsiveElementTagName;
  touch: ResponsiveElementTagName;
  children: React.ReactNode;
  className?: string;
};

const ResponsiveElement = ({
  desktop,
  touch,
  children,
  className,
}: ResponsiveElementInfo) => {
  const Desktop = desktop as keyof JSX.IntrinsicElements;
  const Touch = touch as keyof JSX.IntrinsicElements;
  return (
    <>
      <Desktop className={classnames("is-hidden-touch", className || "")}>
        {children}
      </Desktop>
      <Touch className={classnames("is-hidden-desktop", className || "")}>
        {children}
      </Touch>
    </>
  );
};

export default ResponsiveElement;
