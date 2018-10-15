import autobind from "autobind-decorator";

interface RafCallback {
  handle: number;
  callback: Function;
}

export class FakeRequestAnimationFrame {
  private counter: number;
  callbacks: RafCallback[];

  constructor() {
    this.counter = 0;
    this.callbacks = [];
    window.requestAnimationFrame = this.requestAnimationFrame;
    window.cancelAnimationFrame = this.cancelAnimationFrame;
  }

  @autobind
  requestAnimationFrame(callback: Function): number {
    const handle = ++this.counter;
    this.callbacks.push({ handle, callback });
    return handle;
  }

  @autobind
  cancelAnimationFrame(handle: number) {
    const callbacks = this.callbacks.filter(c => c.handle !== handle);
    if (callbacks.length !== this.callbacks.length - 1) {
      throw new Error(`handle ${handle} not found!`);
    }
    this.callbacks = callbacks;
  }

  runCallbacks() {
    const { callbacks } = this;
    this.callbacks = [];
    callbacks.forEach(c => c.callback());
  }
}
