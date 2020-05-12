import React from "react";
import LoginPage from "../login-page";
import { Route } from "react-router";
import { AppTesterPal } from "../../tests/app-tester-pal";

test('login page sets "next" input to expected value', () => {
  const pal = new AppTesterPal(<Route component={LoginPage} />, {
    url: "/login?next=/bop",
    server: { originURL: "https://blarg.com" },
  });
  pal.rr.getAllByText(/Sign in/i);
  expect(pal.getElement("input", '[name="next"]').value).toEqual(
    "https://blarg.com/bop"
  );
});
