import {
  asUnvalidatedInput,
  validateInput,
  InputValidator,
} from "../client-side-validation";
import { FormError } from "../form-errors";

type HiOrBye = "hi" | "bye";

type Boop = {
  boop: HiOrBye;
  goop: HiOrBye;
};

function isHiOrBye(value: string): value is HiOrBye {
  return value === "hi" || value === "bye";
}

const BoopValidator: InputValidator<Boop> = {
  boop: isHiOrBye,
  goop: isHiOrBye,
};

test("asUnvalidatedInput() returns argument", () => {
  const input: Boop = { boop: "hi", goop: "bye" };
  expect(asUnvalidatedInput(input)).toBe(input);
});

describe("validateInput()", () => {
  it("works when given valid input", () => {
    const input: Boop = { boop: "hi", goop: "bye" };
    const validated = validateInput(asUnvalidatedInput(input), BoopValidator);
    expect(validated.errors).toBe(undefined);
    expect(validated.result).toEqual({ boop: "hi", goop: "bye" });
  });

  it("works when given invalid input", () => {
    const input = { boop: "blarg", goop: "bye" };
    const validated = validateInput(asUnvalidatedInput(input), BoopValidator);
    expect(validated.errors).toEqual({
      nonFieldErrors: [],
      fieldErrors: {
        boop: [new FormError("This value is invalid.")],
      },
    });
    expect(validated.result).toEqual({ goop: "bye" });
  });
});
