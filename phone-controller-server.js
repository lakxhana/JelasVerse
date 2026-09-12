#!/usr/bin/env node
// Local-only bridge for the Orbit Runner iPhone controller.
// It intentionally keeps no history: a controller state expires after 350 ms.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = __dirname;
const port = Number(process.env.PHONE_CONTROLLER_PORT || 4174);
const neutral = () => ({ up:false, down:false, left:false, right:false, boost:false, action:false, pause:false, skip:false, home:false, back:false, settings:false });
let controller = { state: neutral(), updatedAt: 0 };
const allowed = new Set(['up','down','left','right','boost','action','pause','skip','home','back','settings']);

function reply(res, status, headers, body) {
  res.writeHead(status, { 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store', ...headers });
  res.end(body);
}

function controllerState() {
  return Date.now() - controller.updatedAt < 350 ? controller.state : neutral();
}

function localAddresses() {
  return Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address);
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return reply(res, 204, { 'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' }, '');
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/controller' && req.method === 'GET') {
    return reply(res, 200, { 'Content-Type':'application/json' }, JSON.stringify(controllerState()));
  }
  if (url.pathname === '/api/controller' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const input = JSON.parse(body);
        const next = neutral();
        for (const key of allowed) next[key] = input?.[key] === true;
        controller = { state: next, updatedAt: Date.now() };
        reply(res, 204, {}, '');
      } catch { reply(res, 400, { 'Content-Type':'application/json' }, JSON.stringify({ error:'Invalid controller input' })); }
    });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, {}, 'Method not allowed');
  const requested = url.pathname === '/' ? '/phone-controller.html' : url.pathname;
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root + path.sep)) return reply(res, 403, {}, 'Forbidden');
  fs.readFile(file, (error, data) => {
    if (error) return reply(res, 404, {}, 'Not found');
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream';
    reply(res, 200, { 'Content-Type':type }, req.method === 'HEAD' ? '' : data);
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Phone controller is ready on port ${port}.`);
  console.log(`Laptop: http://127.0.0.1:${port}/phone-controller.html`);
  for (const address of localAddresses()) console.log(`iPhone: http://${address}:${port}/phone-controller.html`);
});
