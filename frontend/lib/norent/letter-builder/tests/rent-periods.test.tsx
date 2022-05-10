import { getRentNonpaymentChoices } from "../rent-periods";

it("works CA letters with months after september 2021", () => {
  expect(
    getRentNonpaymentChoices([
      { paymentDate: "2021-9-01" },
      { paymentDate: "2021-10-01" },
      { paymentDate: "2021-11-01" },
    ])
  ).toEqual([
    ["2021-9-01", "September 2021"],
    ["2021-10-01", "October 2021"],
    ["2021-11-01", "November 2021"],
  ]);
});
