//@ts-check
const buffers = [];

process.stdin.on('data', data => {
  buffers.push(data);
});

process.stdin.on('end', () => {
  const result = JSON.parse(Buffer.concat(buffers).toString('utf-8'));

  if (result.stderr) {
    process.stderr.write(Buffer.from(result.stderr, 'utf-8'));
  }

  if (result.output) {
    process.stdout.write(Buffer.from(result.output, 'utf-8'));
  } else if (result.errorText) {
    throw new Error(result.errorText);
  } else if (result.infiniteLoop) {
    while (true) {}
  }
});
