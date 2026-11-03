// Local preview server.
import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Use a port number between 1 and 65535.');
  process.exit(1);
}
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filename = path.resolve(root, requested);
    const assets = path.join(root, 'assets') + path.sep;
    if (filename !== path.join(root, 'index.html') && !filename.startsWith(assets)) {
      res.writeHead(404).end('Not found');
      return;
    }
    const resolved = await realpath(filename);
    if (resolved !== path.join(root, 'index.html') && !resolved.startsWith(assets)) {
      res.writeHead(404).end('Not found');
      return;
    }
    const body = await readFile(resolved);
    res.writeHead(200, {
      'Content-Type': types[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const status = error instanceof URIError ? 400 : 404;
    res.writeHead(status).end(status === 400 ? 'Bad request' : 'Not found');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is in use. Try: node server.mjs ${port + 1}`
    : error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Academic homepage: http://127.0.0.1:${port}`);
  console.log('Edit index.html or assets/css/style.css, then refresh. Ctrl+C to stop.');
});
