const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const ROUTES = {
  '/': '/src/html/index.html',
  '/en': '/src/html/en.html',
  '/login': '/src/html/login.html',
  '/dashboard': '/src/html/dashboard.html',
  '/advisor': '/src/html/advisor.html',
  '/admin': '/src/html/admin.html',
};

function runtimeConfigJs() {
  const apiBase = process.env.WISEPOCKET_API_BASE_URL || process.env.KLARITY_API_BASE_URL || 'https://proyectoingweb2-production.up.railway.app/api';
  const googleId = process.env.KLARITY_GOOGLE_CLIENT_ID || '';

  return [
    'window.WISEPOCKET_API_BASE_URL = ' + JSON.stringify(apiBase) + ';',
    'window.KLARITY_GOOGLE_CLIENT_ID = ' + JSON.stringify(googleId) + ';',
  ].join('\n');
}

function resolvePublicPath(requestPath) {
  const routed = ROUTES[requestPath] || requestPath;
  const safePath = path.normalize(routed).replace(/^([.][.][/\\])+/, '');
  const full = path.join(PUBLIC_DIR, safePath);
  if (!full.startsWith(PUBLIC_DIR)) return null;
  return full;
}

function send(res, status, body, contentType) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    send(res, 400, 'Bad Request', 'text/plain; charset=utf-8');
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/runtime-config.js') {
    send(res, 200, runtimeConfigJs(), 'application/javascript; charset=utf-8');
    return;
  }

  const fullPath = resolvePublicPath(pathname);
  if (!fullPath) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  let filePath = fullPath;
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {
    if (!path.extname(filePath)) {
      filePath += '.html';
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (!path.extname(pathname) && ROUTES[pathname]) {
        const fallback = path.join(PUBLIC_DIR, ROUTES[pathname]);
        fs.readFile(fallback, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            send(res, 404, 'Not Found', 'text/plain; charset=utf-8');
            return;
          }
          send(res, 200, fallbackData, 'text/html; charset=utf-8');
        });
        return;
      }
      send(res, 404, 'Not Found', 'text/plain; charset=utf-8');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Frontend server running on port ' + PORT);
});
