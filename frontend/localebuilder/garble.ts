/**
 * A function that takes a fragment of English text and garbles
 * it in some way.
 */
export type Garbler = (text: string) => string;

/**
 * Take the raw string from a message catalog and "garble" it into
 * gobbledygook.
 */
export function garbleMessage(garbler: Garbler, source: string): string {
  const state = handleEnglish({
    garbler,
    source,
    parts: [],
    i: 0,
  });
  return state.parts.join("");
}

type GarblerState = {
  parts: string[];
  source: string;
  i: number;
  garbler: Garbler;
};

type StateHandler = (s: GarblerState) => GarblerState;

const handleEnglish: StateHandler = (s) => {
  let { i, source, garbler, parts } = s;
  let start = s.i;

  const pushGarbledEnglish = () => {
    const english = s.source.substring(start, i);
    parts = [...parts, garbler(english)];
  };

  while (i < source.length) {
    const ch = source[i];
    let newProcessor: StateHandler | null = null;

    if (ch === "{") {
      newProcessor = handleVariable;
    } else if (ch === "<") {
      newProcessor = handleTag;
    }

    if (newProcessor) {
      pushGarbledEnglish();
      ({ i, parts } = newProcessor({ ...s, i, parts }));
      start = i;
    }

    i++;
  }

  pushGarbledEnglish();

  return { ...s, i, parts };
};

function chompUntil(s: GarblerState, char: string): GarblerState {
  let { i, source } = s;
  const newParts: string[] = [];
  const finish = (i: number): GarblerState => {
    return {
      ...s,
      i,
      parts: [...s.parts, newParts.join("")],
    };
  };

  while (i < source.length) {
    const ch = source[i];
    newParts.push(ch);
    if (ch === char) {
      return finish(i + 1);
    }
    i++;
  }

  return finish(i);
}

const handleVariable: StateHandler = (s) => chompUntil(s, "}");

const handleTag: StateHandler = (s) => chompUntil(s, ">");
