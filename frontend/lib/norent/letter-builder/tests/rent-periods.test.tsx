import { getRentNonpaymentChoices } from "../rent-periods";

it("attaches a caveat for CA letters with months after september 2021", () => {
  expect(
    getRentNonpaymentChoices([
      { paymentDate: "2021-9-01" },
      { paymentDate: "2021-10-01" },
      { paymentDate: "2021-11-01" },
    ])
  ).toEqual([
    "2021-9-01",
    "2021-10-01 (only for City of Los Angeles residents)",
    "2021-11-01 (only for City of Los Angeles residents)",
  ]);
});
