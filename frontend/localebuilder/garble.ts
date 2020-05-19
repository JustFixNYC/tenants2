/**
 * A function that takes a fragment of English text and garbles
 * it in some way.
 */
export type Garbler = (text: string) => string;

/**
 * Take the raw string from a message catalog and "garble" its English
 * text into gobbledygook, while preserving all code.
 */
export function garbleMessage(garbler: Garbler, source: string): string {
  const s = new GarblerState(garbler, source);
  handleEnglish(s);
  return s.value;
}

class GarblerState implements Iterator<string> {
  private parts: string[] = [];
  private i: number = 0;
  private substringStartIndex: number = 0;

  constructor(readonly garbler: Garbler, readonly source: string) {}

  private get hasSubstring() {
    return this.i - this.substringStartIndex > 0;
  }

  private get substring() {
    return this.source.substring(this.substringStartIndex, this.i);
  }

  private push(value: string) {
    this.parts.push(value);
    this.substringStartIndex = this.i;
  }

  pushEnglish() {
    this.hasSubstring && this.push(this.garbler(this.substring));
  }

  pushCode() {
    this.hasSubstring && this.push(this.substring);
  }

  backtrack() {
    this.i--;
  }

  next() {
    if (this.i === this.source.length) {
      return { value: "", done: true };
    }
    const value = this.source[this.i];
    this.i++;
    return { value, done: false };
  }

  pushCodeUntil(chars: string) {
    for (let ch of this) {
      if (chars.indexOf(ch) !== -1) {
        this.pushCode();
        this.next();
        return;
      }
    }

    this.pushCode();
  }

  [Symbol.iterator]() {
    return this;
  }

  get value() {
    return this.parts.join("");
  }
}

type StateHandler = (s: GarblerState) => void;

type StateHandlerMap = {
  [ch: string]: StateHandler | undefined;
};

const handleEnglish = (s: GarblerState, untilChar?: string) => {
  const handlers: StateHandlerMap = {
    "{": handleVariable,
    "<": handleTag,
  };

  for (let ch of s) {
    if (ch === untilChar) {
      s.backtrack();
      s.pushEnglish();
      return;
    }

    let newHandler = handlers[ch];

    if (newHandler) {
      s.backtrack();
      s.pushEnglish();
      newHandler(s);
      s.backtrack();
    }
  }

  s.pushEnglish();
};

const handleVariable: StateHandler = (s) => {
  s.next();
  for (let ch of s) {
    if (ch === "{") {
      s.pushCode();
      handleEnglish(s, "}");
      s.next();
    } else if (ch === "}") {
      s.pushCode();
      s.next();
      return;
    }
  }
};

const handleTag: StateHandler = (s) => s.pushCodeUntil(">");
