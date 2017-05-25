const http = require('http');

function request() {
  if (!process.env['CI_HOST']) {
    return console.error('CI_HOST required.');
  }
  if (!process.env['CI_PROJECT']) {
    return console.error('CI_PROJECT required.');
  }
  if(!process.env['CI_TOKEN']) {
    return console.error('CI_TOKEN required.');
  }
  return new Promise((resolve, reject) => {
    console.log(`Request jenkins remote build:`);
    console.log(`  http://${process.env['CI_HOST'] || '127.0.0.1'}:${process.env['CI_PORT'] || '8080'}/job/${process.env['CI_PROJECT']}/build?token=${process.env['CI_TOKEN']}`);
    let req = http.request({
      method: 'GET',
      host: process.env['CI_HOST'] || '127.0.0.1',
      port: process.env['CI_PORT'] || '8080',
      path: `/job/${process.env['CI_PROJECT']}/build?token=${process.env['CI_TOKEN']}`
    }, res => {
      console.log('Response status:', res.statusCode, res.statusMessage);
      let _body = '';
      let _end = false;
      res.on('data', chunk => {
        if (_end) return;
        _body += chunk.toString();
      });
      res.on('end', () => {
        if (_end) return;
        console.log('Response body:', _body);
        resolve(_body);
        _end = true;
      });
      res.on('error', err => {
        if (_end) return;
        reject(err);
        _end = true;
      });
    });
    req.end();
  });
}

module.exports = async function pushEventHandler(detail) {
  if (detail.ref === 'refs/heads/master') {
    await request();
  }
};