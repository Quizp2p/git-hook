const WebSocketClient = require('ws');
const client = new WebSocketClient(
  `ws${
    process.env['WS_SSL'] ? 's' : ''
  }://${
    process.env['WS_HOST'] || 'ws.cloud.hansight.design'
  }:${
    process.env['WS_PORT'] || 80
  }/__ws?token=${
    process.env['WS_SECRET_TOKEN'] || 'hansight-12qwaszx'
  }`
);
const path = require('path');
const TASKS_PATH = path.resolve(process.cwd(), process.env['TASKS_PATH'] || './tasks');

client.on('message', msg => {
  console.log('Got message:', msg);
  if (msg === '$pong') return;
  try {
    msg = JSON.parse(msg);
  } catch(ex) {
    console.error(ex);
    return;
  }
  if (!msg.cmd) return;
  let handler = null;
  try {
    handler = require(path.join(TASKS_PATH, msg.cmd + '.js'));
    handler(msg.data);
  } catch(ex) {
    console.error(ex);
  }
});

client.on('open', () => {
  console.log('connected.');
  setInterval(() => {
    client.send('$ping');
  }, 45000);
});

client.on('error', err => {
  console.error(err);
});

client.on('close', () => {
  console.error('disconnected');
  process.exit(0); // 直接退出进程，由 docker 来管理重启
});