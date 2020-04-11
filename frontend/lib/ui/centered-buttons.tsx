import React from 'react';

export const CenteredButtons: React.FC<{children: JSX.Element[]}> = ({children}) => {
  return <div>
    {React.Children.map(children, (child, i) => <div key={i} className="has-text-centered">{child}</div>)}
  </div>;
};
