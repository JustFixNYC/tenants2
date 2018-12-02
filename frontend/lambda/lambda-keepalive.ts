type ReadStateMode = 'header'|'payload';

interface ReadState {
  readonly mode: ReadStateMode;
  readonly chunks: Buffer[];
  readonly bytesLeft: number;
}

const HEADER_SIZE = 4;

function newReadState(mode: ReadStateMode, length: number): ReadState {
  return {
    mode,
    chunks: [],
    bytesLeft: length
  };
}

type onDataCb = (data: Buffer, respond: (data: Buffer) => void) => void;

export function createKeepalive(onData: onDataCb, stdin = process.stdin, stdout = process.stdout) {
  let readState = newReadState('header', HEADER_SIZE);

  stdin.on('data', (chunk: Buffer) => {
    while (chunk.length) {
      if (readState.bytesLeft <= chunk.length) {
        const finalBuffer = Buffer.concat([
          ...readState.chunks,
          chunk.slice(0, readState.bytesLeft)
        ]);
        chunk = chunk.slice(readState.bytesLeft, chunk.length);
        switch (readState.mode) {
          case 'header':
          readState = newReadState('payload', finalBuffer.readUInt32BE(0));
          console.log('got header, reading data w/ len', readState.bytesLeft);
          break;

          case 'payload':
          readState = newReadState('header', HEADER_SIZE);
          onData(finalBuffer, writeData);
          break;
        }
      } else {
        readState = {
          ...readState,
          chunks: [...readState.chunks, chunk],
          bytesLeft: readState.bytesLeft - chunk.length
        };
        break;
      }
    }
  });

  function writeData(data: Buffer) {
    const lengthBuf = new Buffer(HEADER_SIZE);
    lengthBuf.writeUInt32BE(data.length, 0);
    stdout.write(lengthBuf);
    stdout.write(data);
  }
}
