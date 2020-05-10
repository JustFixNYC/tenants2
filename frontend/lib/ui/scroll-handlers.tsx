import React, { useContext, useEffect } from "react";
import { AppContext } from "../app-context";
import { smoothlyScrollToTopOfPage } from "../util/scrolling";
import { TransitionContext } from "./transition-context";

function noScroll() {}

function useScrollHandler(handler: Function) {
  const {pushScrollHandler, popScrollHandler} = useContext(AppContext);
  const {transition} = useContext(TransitionContext);

  useEffect(() => {
    if (transition === "exit") return;
    pushScrollHandler(handler);

    return () => popScrollHandler(handler);
  }, [pushScrollHandler, popScrollHandler, handler, transition]);
}

export const NoScrollOnEnter: React.FC<{}> = () => {
  useScrollHandler(noScroll);
  return null;
};

export const SmoothlyScrollToTopOnEnter: React.FC<{}> = () => {
  useScrollHandler(smoothlyScrollToTopOfPage);
  return null;
};
