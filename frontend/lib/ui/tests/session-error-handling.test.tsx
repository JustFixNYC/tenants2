import React, { useContext } from "react";
import { AppTesterPal } from "../../tests/app-tester-pal";
import { withSessionErrorHandling } from "../session-error-handling";
import { isUserLoggedIn } from "../../util/session-predicates";
import { AppContext } from "../../app-context";

const ErrorPage: React.FC<{}> = () => <p>You should be logged out.</p>;

const Page: React.FC<{ foo: string }> = ({ foo }) => {
  const { session } = useContext(AppContext);
  return (
    <>
      <p>Foo is {foo}.</p>
      {session.phoneNumber ? (
        <p>Your number is {session.phoneNumber}.</p>
      ) : (
        <p>You are logged out.</p>
      )}
    </>
  );
};

const PageWithErrorHandling = withSessionErrorHandling(
  isUserLoggedIn,
  ErrorPage,
  Page
);

describe("SessionErrorHandlingPage", () => {
  

  it("shows page when not in error state", () => {
    const pal = new AppTesterPal(<PageWithErrorHandling foo="Boop" />);

    pal.rr.getByText("Foo is Boop.");
  });

  it("still shows page when it transitions to error state", async () => {
    const pal = new AppTesterPal(<PageWithErrorHandling key="1" foo="Boop" />);

    pal.rr.getByText("Foo is Boop.");
    pal.rr.getByText("You are logged out.");

    // Simulate logging in without actually remounting the page.
    pal.appContext.session = {
      ...pal.appContext.session,
      phoneNumber: "5551234567",
    };
    pal.rerender(<PageWithErrorHandling key="1" foo="Boop" />);
    pal.rr.getByText("Foo is Boop.");
    pal.rr.getByText("Your number is 5551234567.");

    // Now re-mount the page by changing the key.
    pal.rerender(<PageWithErrorHandling key="2" foo="Boop" />);
    pal.rr.getByText("You should be logged out.");
  });

  it("shows error when in error state", () => {
    const pal = new AppTesterPal(<PageWithErrorHandling foo="Boop" />, {
      session: { phoneNumber: "5551234567" },
    });

    pal.rr.getByText("You should be logged out.");
  });
});
