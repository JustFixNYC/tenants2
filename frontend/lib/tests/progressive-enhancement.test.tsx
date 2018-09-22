import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { ProgressiveEnhancementProps, ProgressiveEnhancement } from "../progressive-enhancement";
import ReactTestingLibraryPal from './rtl-pal';


const HorribleComponent = (): JSX.Element => {
  throw new Error("blaah");
}


describe("ProgressiveEnhancement", () => {
  let mockConsoleError: jest.SpyInstance;

  const props: ProgressiveEnhancementProps = {
    renderBaseline() {
      return <p>i am baseline</p>;
    },
    renderEnhanced() {
      return <p>i am enhanced</p>;
    }
  };

  beforeEach(() => {
    mockConsoleError = jest.spyOn(console, 'error');
    mockConsoleError.mockImplementation(() => {})
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  afterEach(ReactTestingLibraryPal.cleanup);

  it("renders baseline version on server-side", () => {
    const html = ReactDOMServer.renderToString(<ProgressiveEnhancement {...props}/>);
    expect(html).toMatch(/i am baseline/);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("renders enhanced version on clients with JS", () => {
    const pal = new ReactTestingLibraryPal(<ProgressiveEnhancement {...props}/>);
    pal.rr.getByText(/i am enhanced/);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("renders baseline if enhanced version raises an error", () => {
    const pal = new ReactTestingLibraryPal(
      <ProgressiveEnhancement {...props} renderEnhanced={() => <HorribleComponent/> } />
    );
    pal.rr.getByText(/i am baseline/);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("propagates error if both enhanced and baseline throw", () => {
    expect(() => new ReactTestingLibraryPal(
      <ProgressiveEnhancement {...props}
        renderEnhanced={() => <HorribleComponent/> }
        renderBaseline={() => <HorribleComponent/> }/>
    )).toThrow(/blaah/);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("renders baseline if disabled is true", () => {
    const pal = new ReactTestingLibraryPal(<ProgressiveEnhancement {...props} disabled/>);
    pal.rr.getByText(/i am baseline/);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("falls back to baseline if enhanced version tells it to", () => {
    const err = new Error('oof');
    const pal = new ReactTestingLibraryPal(
      <ProgressiveEnhancement {...props} renderEnhanced={(ctx) => {
        return <button onClick={() => ctx.fallbackToBaseline(err)}>
          kaboom
        </button>;
      }} />
    );
    pal.clickButtonOrLink('kaboom');
    pal.rr.getByText(/i am baseline/);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Falling back to baseline implementation due to error: ',
      err
    );
  });
});
