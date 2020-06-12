import { act } from "react-dom/test-utils";
import { render, unmountComponentAtNode } from "react-dom";
import React from "react";

import { useEffect } from "react";

const RenderChild: React.FC<{ onMount: Function }> = ({ onMount }) => {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return null;
};

export function preloadComponent(
  Component: React.ComponentType<{ children: React.ReactNode }>
): Promise<void> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const cleanup = () => {
      unmountComponentAtNode(container);
      container.remove();
      resolve();
    };
    const handleMount = () => {
      setTimeout(cleanup, 0);
    };

    act(() => {
      render(
        <Component>
          <RenderChild onMount={handleMount} />
        </Component>,
        container
      );
    });
  });
}
