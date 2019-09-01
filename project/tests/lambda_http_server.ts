import * as lambdaIo from '../../frontend/lambda/lambda-io';

type LambdaEvent = {
  echo?: string,
  explode?: boolean,
  hang?: boolean
};

export function main() {
  lambdaIo.serveLambdaOverHttp((event: LambdaEvent) => {
    if (event.echo) {
      return {echo: event.echo};
    }
    if (event.explode) {
      throw new Error('exploding!');
    }
    if (event.hang) {
      while (1) {}
    }
    return {error: 'unknown command'};
  });
}

if (!module.parent) {
  main();
}
