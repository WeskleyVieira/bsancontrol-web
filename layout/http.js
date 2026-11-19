'use strict';

const fs = require('node:fs');
const path = require('node:path');
const enabled = process.env.BSAN_LAYOUT_STUDIO === '1' && process.env.AUTH_REQUIRED === '1';
const assets = new Map();
for (const file of [
  'boot.js', 'integral.js', 'integral.css', 'integral-products.js', 'integral-products.css',
  'integral-preferences.js', 'integral-charts.js', 'studio-catalogue.js', 'studio-composition.js',
  'studio-experience.js', 'studio-experience.css', 'studio-snapshot.js', 'studio.css'
]) assets.set('/layout/' + file, () => path.join(__dirname, file));
assets.set('/layout/vendor/html-to-image.js', () => require.resolve('html-to-image/dist/html-to-image.js'));
assets.set('/layout/vendor/html2canvas.js', () => require.resolve('html2canvas/dist/html2canvas.min.js'));

function main(html) {
  return html.replace('</head>', '<script defer src="/layout/boot.js"></script></head>');
}

function product(html) {
  const styles = ['integral-products.css', 'studio.css', 'studio-experience.css'];
  const scripts = ['integral-preferences.js', 'studio-catalogue.js', 'studio-composition.js', 'integral-products.js'];
  const tags = styles.map(file => '<link rel="stylesheet" href="/layout/' + file + '">')
    .concat(scripts.map(file => '<script defer src="/layout/' + file + '"></script>'));
  return html.replace('</head>', tags.join('\n') + '\n</head>');
}

function serve(req, res, pathname) {
  const resolve = assets.get(pathname);
  if (!resolve) return false;
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return true;
  }
  const file = resolve();
  fs.readFile(file, (err, bytes) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  });
  return true;
}

module.exports = { enabled, main, product, serve };
