import React from "react";
import { useDebouncedValue } from "../use-debounced-value";
import ReactTestingLibraryPal from "../../tests/rtl-pal";
import { act } from "@testing-library/react";

const MyThing: React.FC<{ value: string }> = ({ value }) => {
  const debounced = useDebouncedValue(value, 5000);

  return (
    <p>
      value is {value}, debounced is {debounced}
    </p>
  );
};

describe("useDebouncedValue()", () => {
  it("works", () => {
    jest.useFakeTimers();
    const pal = new ReactTestingLibraryPal(<MyThing value="hi" />);
    const getHTML = () => pal.getElement("p").innerHTML;

    expect(getHTML()).toBe("value is hi, debounced is hi");

    pal.rr.rerender(<MyThing value="bye" />);

    expect(getHTML()).toBe("value is bye, debounced is hi");
    act(() => {
      jest.runTimersToTime(3000);
    });
    expect(getHTML()).toBe("value is bye, debounced is hi");

    pal.rr.rerender(<MyThing value="hmm" />);

    expect(getHTML()).toBe("value is hmm, debounced is hi");
    act(() => {
      jest.runTimersToTime(3000);
    });
    expect(getHTML()).toBe("value is hmm, debounced is hi");
    act(() => {
      jest.runTimersToTime(3000);
    });
    expect(getHTML()).toBe("value is hmm, debounced is hmm");
  });
});
