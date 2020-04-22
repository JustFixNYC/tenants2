import React, { useContext } from "react";
import { AppContext } from "../app-context";

export type DemoDeploymentNoteProps = {
  children: JSX.Element | JSX.Element[];
};

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
