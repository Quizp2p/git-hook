const fs = require('fs');
const path = require('path');
const TASKS_PATH = path.resolve(process.cwd(), process.env['TASKS_PATH'] || './tasks');

module.exports = function handleWebhook(data) {
  _process(data).catch(ex => {
    console.error(ex);
  });
};

async function _process(data) {
  let eventName = data.eventName;
  if (!eventName) {
    console.error('eventName required.');
    return;
  }
  let detail = data.detail;
  if (!detail) {
    console.error('detail required.');
    return;
  }
  let repository = detail.repository;
  if (!repository) {
    console.error('repository required.');
    return;
  }

  try {
    let st = fs.statSync(path.join(TASKS_PATH, repository.name));
    if (!st.isDirectory()) {
      console.log(`[WARN] directory for repository ${repository.name} not exists`);
      return;
    }
  } catch(ex) {
    if (ex.message.indexOf('not exists') >= 0) {
      console.log(`[WARN] directory for repository ${repository.name} not exists`);
    } else {
      console.error(ex);
    }
    return;
  }

  try {
    let st = fs.statSync(path.join(TASKS_PATH, repository.name, `${eventName}.js`));
    if (!st.isFile) {
      console.log(`[WARN] file for event ${eventName} not exists`);
      return;
    }
  } catch(ex) {
    if (ex.message.indexOf('not exists') >= 0) {
      console.log(`[WARN] file for event ${eventName} not exists`);
    } else {
      console.error(ex);
    }
    return;
  }

  try {
    let eventHandler = require(path.join(TASKS_PATH, repository.name, `${eventName}.js`));
    await eventHandler(detail);
  } catch(ex) {
    console.error(ex);
  }
}