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
  const mg = new MessageGarbler(source, garbler);
  return mg.garble();
}

class MessageGarbler {
  private parts: string[] = [];

  constructor(
    readonly source: string,
    readonly garbler: Garbler,
  ) {}

  garble(): string {
    this.processEnglish(0);
    return this.parts.join('');
  }

  private chompUntil(i: number, char: string): number {
    while (i < this.source.length) {
      const ch = this.source[i];

      if (ch === char) {
        this.parts.push(ch);
        return i + 1;
      } else {
        this.parts.push(ch);
      }

      i++;
    }
    return i;
  }

  private processVariable(i: number): number {
    return this.chompUntil(i, '}');
  }

  private processTag(i: number): number {
    return this.chompUntil(i, '>');
  }

  private processEnglish(i: number) {
    let start = i;

    const pushToParts = () => {
      const english = this.source.substring(start, i);
      this.parts.push(this.garbler(english));
    };

    while (i < this.source.length) {
      const ch = this.source[i];

      if (ch === '{') {
        pushToParts();
        i = this.processVariable(i);
        start = i;
      } else if (ch === '<') {
        pushToParts();
        i = this.processTag(i);
        start = i;
      }
      i++;
    }

    pushToParts();
  }
};
