import { AppContextType, AppServerInfo } from "../../app-context";
import { FakeAppContext } from "../../tests/util";
import { QueryLoaderPrefetcher } from "../query-loader-prefetcher";

function makeAppCtx(
  prefetchedGraphQLQueryResponse?: AppServerInfo["prefetchedGraphQLQueryResponse"]
) {
  const ctx: AppContextType = {
    ...FakeAppContext,
    server: {
      ...FakeAppContext.server,
      prefetchedGraphQLQueryResponse,
    },
  };

  return ctx;
}

function makeQlp(
  appCtx: AppContextType,
  options: {
    graphQL: string;
    input: any;
  }
) {
  const fakeRouter = null as any;
  const fetch = "FAKE" as any;
  return new QueryLoaderPrefetcher(
    fakeRouter,
    appCtx,
    {
      graphQL: options.graphQL,
      name: "MyFunkyQuery",
      fetch,
    },
    options.input
  );
}

describe("QueryLoaderPrefetcher", () => {
  it("does not touch prefetched GraphQL responses that don't belong to it", () => {
    const ctx = makeAppCtx({
      graphQL: "query { blah }",
      input: null,
      output: "boop",
    });
    const qlp = makeQlp(ctx, {
      graphQL: "query { notBlah }",
      input: null,
    });
    expect(qlp.prefetchedResponse).toBeUndefined();
    expect(ctx.server.prefetchedGraphQLQueryResponse?.output).toBe("boop");
  });

  it("removes prefetched GraphQL responses that belong to it", () => {
    const ctx = makeAppCtx({
      graphQL: "query { blah }",
      input: { thing: 1 },
      output: "boop",
    });
    const qlp = makeQlp(ctx, {
      graphQL: "query { blah }",
      input: { thing: 1 },
    });
    expect(qlp.prefetchedResponse).toBe("boop");
    expect(ctx.server.prefetchedGraphQLQueryResponse).toBeUndefined();
  });
});
