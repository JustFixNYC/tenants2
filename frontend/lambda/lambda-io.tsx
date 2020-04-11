import http from "http";
import { AddressInfo } from "net";

export type LambdaHandler = (event: any) => any;

/** Return whether the argument is a plain ol' JS object (not an array). */
export function isPlainJsObject(obj: any): boolean {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

/**
 * This takes an input stream, decodes it as JSON, passes it
 * to the event handler, and returns the handler's response
 * encoded as UTF-8.
 *
 * @param handler The event handler.
 * @param input An input stream with UTF-8 encoded JSON content.
 */
export function handleFromJSONStream(
  handler: LambdaHandler,
  input: NodeJS.ReadableStream
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];

    input.on("data", (data) => {
      buffers.push(data);
    });

    input.on("end", () => {
      const buffer = Buffer.concat(buffers);
      let obj: any;
      try {
        obj = JSON.parse(buffer.toString("utf-8"));
        /* istanbul ignore next: we are covering this but istanbul is weird. */
        if (!isPlainJsObject(obj)) {
          throw new Error("Expected input to be a JS object!");
        }
        const response = handler(obj);
        resolve(Buffer.from(JSON.stringify(response), "utf-8"));
      } catch (e) {
        /* istanbul ignore next: we are covering this but istanbul is weird. */
        return reject(e);
      }
    });
  });
}

/**
 * Respond to the given HTTP request with the given event handler.
 */
export function lambdaHttpHandler(
  handler: LambdaHandler,
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const fail = (statusCode: number) => {
    res.statusCode = statusCode;
    res.end();
  };
  if (req.url !== "/") {
    return fail(404);
  }
  if (req.method !== "POST") {
    return fail(405);
  }
  if (req.headers["content-type"] !== "application/json") {
    return fail(415);
  }
  handleFromJSONStream(handler, req)
    .then((buf) => {
      res.setHeader("Content-Type", "application/json");
      res.end(buf);
    })
    .catch((e) => {
      if (e instanceof SyntaxError) {
        return fail(400);
      }
      console.error(e);
      fail(500);
    });
}

/** Return the address of the given HTTP server. */
export function getServerAddress(server: http.Server): AddressInfo {
  const addr = server.address();
  if (typeof addr === "string") {
    throw new Error(`Expected address to be an object but it is "${addr}"!`);
  }
  return addr;
}

/* istanbul ignore next: this is tested by integration tests. */
export function serveLambdaOverHttp(handler: LambdaHandler) {
  const server = http.createServer(lambdaHttpHandler.bind(null, handler));
  server.listen(() => {
    const addr = getServerAddress(server);
    process.stdin.setEncoding("utf-8");
    process.stdin.on("readable", () => {});
    process.stdin.on("end", () => {
      server.close();
    });
    process.stdout.write(`LISTENING ON PORT ${addr.port}\n`);
  });
}

/* istanbul ignore next: this is tested by integration tests. */
export function serveLambdaOverStdio(handler: LambdaHandler) {
  handleFromJSONStream(handler, process.stdin)
    .then((buf) => {
      process.stdout.write(buf);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
