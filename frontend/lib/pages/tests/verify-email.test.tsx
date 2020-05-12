import React from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { Switch, Route } from "react-router-dom";
import { VerifyEmail } from "../verify-email";

describe("VerifyEmail", () => {
  const routes = (
    <Switch>
      <Route
        path="/verify"
        exact
        render={() => <VerifyEmail prevUrl="/prev" nextUrl="/next" />}
      />
    </Switch>
  );

  

  it("works if user has no email address", () => {
    const pal = new AppTesterPal(routes, { url: "/verify" });
    pal.rr.getByText(/We don't seem to have an email/i);
  });

  it("works if user already has an email address", () => {
    const pal = new AppTesterPal(routes, {
      url: "/verify",
      session: { email: "boop@jones.com" },
    });
    pal.rr.getByText(/make sure your email address below is correct/i);
  });

  it("waits for user to verify their email address", () => {
    const pal = new AppTesterPal(routes, { url: "/verify?v=waiting" });
    pal.rr.getByText(/An email to verify your account is on its way/i);
  });

  it("redirects to success page from waiting step once email is verified", () => {
    const pal = new AppTesterPal(routes, {
      url: "/verify?v=waiting",
      session: { isEmailVerified: true },
    });
    pal.rr.getByText(/Thank you for verifying/i);
    expect(pal.history.location.search).toBe("?v=success");
  });

  it("redirects to success page from start step if email is verified", () => {
    const pal = new AppTesterPal(routes, {
      url: "/verify",
      session: { isEmailVerified: true },
    });
    pal.rr.getByText(/Thank you for verifying/i);
    expect(pal.history.location.search).toBe("?v=success");
  });
});
