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

  peek(): string | undefined {
    return this.source[this.i];
  }

  next() {
    if (this.i === this.source.length) {
      return { value: "", done: true };
    }
    const value = this.source[this.i];
    this.i++;
    return { value, done: false };
  }

  nextMany(count: number) {
    for (let i = 0; i < count; i++) {
      this.next();
    }
  }

  pushCodeUntil(str: string) {
    for (let _ of this) {
      if (this.source.substr(this.i - 1, str.length) == str) {
        this.nextMany(str.length - 1);
        this.pushCode();
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

    if (!newHandler && ch === "%" && s.peek() === "(") {
      newHandler = handleGettextVariable;
    }

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

const handleGettextVariable: StateHandler = (s) => s.pushCodeUntil(")s");
