import React from "react";

export type DemoDeploymentNoteProps = {
  children: JSX.Element|JSX.Element[]
};

export const DemoDeploymentNote: React.FC<DemoDeploymentNoteProps> = ({children}) => {
  return <aside className="jf-demo-deployment-note">
    <div className="jf-demo-deployment-note-heading">
      <span>Demo site note</span>
    </div>
    <div className="jf-demo-deployment-note-content">
      {children}
    </div>
  </aside>
};
