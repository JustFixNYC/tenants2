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

  private processVariable(i: number): number {
    while (i < this.source.length) {
      const ch = this.source[i];

      if (ch === '}') {
        this.parts.push(ch);
        return i + 1;
      } else {
        this.parts.push(ch);
      }

      i++;
    }
    return i;
  }

  private processEnglish(i: number) {
    let start = i;

    while (i < this.source.length) {
      const ch = this.source[i];

      if (ch === '{') {
        const english = this.source.substring(start, i);
        this.parts.push(this.garbler(english));
        i = this.processVariable(i);
        start = i;
      }
      i++;
    }

    const english = this.source.substring(start, i);
    this.parts.push(this.garbler(english));
  }
};
