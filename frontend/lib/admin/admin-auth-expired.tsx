import React from "react";

export const AdminAuthExpired: React.FC<{}> = () => (
  <div className="content">
    <p>
      Your administrative authentication has expired! Please reload the page.
    </p>
    <button
      className="button is-primary"
      onClick={() => window.location.reload()}
    >
      Reload
    </button>
  </div>
);
