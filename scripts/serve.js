import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Local preview/test server only. Explicit routes avoid exposing repository files.
const root = new URL('../', import.meta.url);
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/roulette.js', ['roulette.js', 'text/javascript; charset=utf-8']],
]);
const port = Number(process.env.PORT ?? 4173);
const server = createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, 'http://localhost').pathname);
  if (!route || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const content = await readFile(new URL(route[0], root));
    response.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(500).end('Unable to load preview asset');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Previewing ${fileURLToPath(root)} at http://127.0.0.1:${port}`);
});
