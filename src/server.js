const http = require('http');
const WebSocketServer = require('ws').Server;
const url = require('url');
const qs = require('querystring');
const SECRET_TOKEN = process.env['SECRET_TOKEN'] || 'hansight-12qwaszx';
const clients = [];

const server = http.createServer((req, res) => {
  let __end = false;
  let __accept = false;
  let __body = '';
  let __ct = req.headers['content-type'];

  function onEnd(err) {
    if (__end) return;
    if (err) {
      console.error(err);
      process.nextTick(function() {req.destroy()});
    }
    __end = true;
    if (__accept) {
      send();
    }
    clear();
  }
  function clear() {
    if (__end) return;
    req.removeListener('error', onEnd);
    req.removeListener('aborted', onAborted);
    req.removeListener('end', onEnd);
    req.removeListener('close', onEnd);
    req.removeListener('data', onData);
  }
  function onAborted() {
    process.nextTick(function() {req.destroy()});
    onEnd();
  }
  function onData(chunk) {
    if (!__accept) {
      req.destroy();
      return onEnd();
    }
    __body += chunk.toString();
  }
  function send() {
    if (!__body) return end();
    let data;
    try {
      data = __ct === 'application/json' ? JSON.parse(__body) : qs.parse(__body);
    } catch(ex) {
      return end(500);
    }
    clients.forEach(ws => {
      try {
        ws.send(JSON.stringify({
          cmd: 'webhook',
          data: {
            eventName: req.headers['X-GitHub-Event'] || req.headers['x-github-event'],
            detail: data
          }
        }));
      } catch(ex) {
        // ignore
      }
    });
    res.writeHead(200);
    res.write(`Send to ${clients.length} clients.`);
    res.end();
  }
  function end(status = 200) {
    res.writeHead(status);
    res.end();
  }
  req.on('error', onEnd);
  req.on('aborted', onAborted);
  req.on('close', onEnd);
  req.on('end', onEnd);
  req.on('data', onData);

  if (req.method !== 'POST') {
    res.writeHead(200);
    res.write('Hello, Hansight!');
    res.end();
    return;
  }

  if (req.headers['x-hub-signature'] === SECRET_TOKEN) {
    if (req.url !== '/') {
      return end(404);
    }
  } else {
    if (!req.url.startsWith('/?token=')) {
      return end(404);
    }
    let _q = url.parse(req.url, true).query;
    if (!_q || !_q.token || _q.token !== SECRET_TOKEN) {
      return end(401);
    }
  }

  if (['application/x-www-form-urlencoded','application/json'].indexOf(__ct) >= 0) {
    __accept = true;
  } else {
    return end();
  }
});
const wsServer = new WebSocketServer({
  server
});
wsServer.shouldHandle = request => {
  if (request.url !== `/__ws?token=${SECRET_TOKEN}`) {
    return false;
  } {
    return true;
  }
};

wsServer.on('connection', ws => {
  let __close = false;
  function on_message(msg) {
    if (__close) return;
    if (msg === '$ping') {
      ws.send('$pong');
    } else {
      close_handler();
    }
  }
  function close_handler() {
    if (__close) return;
    let idx = clients.indexOf(ws);
    if (idx >= 0) clients.splice(idx, 1);
    try {
      ws.terminate();
    } catch(ex) {
      // ignore
    }
    __close = true;
  }
  ws.on('message', on_message);
  ws.on('close', close_handler);
  ws.on('error', close_handler);
  clients.push(ws);
});

server.listen(Number(process.env['PORT'] || 3001), () => {
  console.log('git-hook server ready.');
});