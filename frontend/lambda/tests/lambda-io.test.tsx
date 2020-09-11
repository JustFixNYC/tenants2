import {
  isPlainJsObject,
  handleFromJSONStream,
  lambdaHttpHandler,
  getServerAddress,
} from "../lambda-io";
import { Readable } from "stream";
import fetch from "cross-fetch";
import { createServer } from "http";

const handler = (event: any) => {
  if (event.explode) {
    throw new Error("exploding!");
  }
  return { event, status: 200 };
};

test("isPlainJsObject works", () => {
  expect(isPlainJsObject(null)).toBe(false);
  expect(isPlainJsObject([])).toBe(false);
  expect(isPlainJsObject({})).toBe(true);
});

describe("handleFromJSONStream", () => {
  const makeStream = (thing: any) => {
    const stream = new Readable();
    let text = typeof thing === "string" ? thing : JSON.stringify(thing);
    stream.push(Buffer.from(text, "utf-8"));
    stream.push(null);
    return stream;
  };

  const handle = async (thing: any) => {
    const response = await handleFromJSONStream(handler, makeStream(thing));
    return JSON.parse(response.toString("utf-8"));
  };

  it("works", async () => {
    const response = await handle({});
    expect(response.status).toBe(200);
  });

  it("raises error on malformed input", async () => {
    const response = handle("i am not valid json");
    return expect(response).rejects.toBeInstanceOf(SyntaxError);
  });

  it("raises error on bad JSON input", async () => {
    const response = handle(null);
    return expect(response).rejects.toEqual(
      new Error("Expected input to be a JS object!")
    );
  });
});

describe("lambdaHttpHandler()", () => {
  let url = "http://127.0.0.1:";
  const server = createServer(lambdaHttpHandler.bind(null, handler));

  beforeAll((done) => {
    server.listen(() => {
      url += getServerAddress(server).port + "/";
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it("returns HTTP 405 (Method Not Allowed)", async () => {
    const res = await fetch(url);
    expect(res.status).toBe(405);
  });

  it("returns HTTP 404 (Not Found)", async () => {
    const res = await fetch(url + "boop/");
    expect(res.status).toBe(404);
  });

  it("returns HTTP 415 (Unsupported Media Type) when content type is invalid", async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "boop=jones",
    });
    expect(res.status).toBe(415);
  });

  it("returns HTTP 400 (Bad Request) when content is malformed", async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "boop=jones",
    });
    expect(res.status).toBe(400);
  });

  it("returns HTTP 200 when everything is OK", async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boop: "Jones\u2026" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ event: { boop: "Jones\u2026" }, status: 200 });
  });

  it("returns HTTP 500 and logs error when handler throws an error", async () => {
    const oldError = console.error;
    const errorFn = jest.fn();
    console.error = errorFn;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ explode: true }),
      });
      expect(res.status).toBe(500);
      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(errorFn.mock.calls[0][0].message).toBe("exploding!");
    } finally {
      console.error = oldError;
    }
  });
});
