import React, { useContext } from "react";
import { AppContext } from "../app-context";

export type DemoDeploymentNoteProps = {
  children: JSX.Element | JSX.Element[];
};

/**
 * If the current deployment happens to be a demo intended for
 * instructional and training purposes, this component displays a note
 * that explains how this demo differs from "the real thing".
 *
 * If the current deployment is *not* a demo, nothing will be shown.
 */
export const DemoDeploymentNote: React.FC<DemoDeploymentNoteProps> = ({
  children,
}) => {
  const { server } = useContext(AppContext);

  if (!server.isDemoDeployment) return null;

  return (
    <aside className="jf-demo-deployment-note">
      <span className="tag is-warning">DEMO SITE NOTE</span>
      <div className="content has-text-centered">{children}</div>
    </aside>
  );
};
