'use strict';

const fs = require('fs');
const express = require('express');
const {spawn} = require('child_process');
const mime = require('mime');
const upload = require('multer')();
const vm = require('vm');
const puppeteer = require('../node_modules/puppeteer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function setupFileCreationWatcher() {
  // TODO: do more than this to cleanup + prevent malicious deeds.
  return new Promise((resolve, reject) => {
    const watcher = fs.watch('./', {recursive: true}, (eventType, filename) => {
      watcher.close();
      resolve(filename);
    });
  });
}

/**
 * @param {!Promise<string>} fileCreated
 * @param {!Array<string>} log
 * @return {!Promise<!Object>}
 */
async function buildResponse(fileCreated, log) {
  const respObj = {log: log.join('\\n')};

  // If a screenshot/pdf was saved, get its filename and mimetype.
  // Wait a max of 100ms for a file to be created. The race is necessary
  // because the promise may never never resolve if the user's code never
  // attempts to create a file.
  const filename = await Promise.race([fileCreated, sleep(100)]);
  if (filename) {
    respObj.result = {
      type: mime.lookup(filename),
      buffer: fs.readFileSync(filename)
    };
    fs.unlinkSync(filename); // Remove the file that the user created.
  }
  return respObj;
}

/**
 * @param {string} code User code to run.
 * @return {!Promise}
 */
function runCodeInSandbox(code) {
  code = `
    const log = [];

    // Define inline functions and capture user console logs.
    const logger = (...args) => log.push(args);
    console.log = logger;
    console.info = logger;
    console.warn = logger;

    const sleep = ${sleep.toString()}; // inline function
    const fileCreated = ${setupFileCreationWatcher.toString()}(); // inline function

    // Wrap user code in an async function so async/await can be used out of the box.
    (async() => {
      ${code}
      return ${buildResponse.toString()}(fileCreated, log); // inline function, call it
    })();
  `;

  // Sandbox user code. Provide new context with limited scope.
  return vm.runInNewContext(code, {puppeteer, fs, mime, setTimeout});
}

// /**
//  * @param {string} code User code to run.
//  * @return {!Promise}
//  */
// function runCodeUsingSpawn(code) {
//   return new Promise((resolve, reject) => {
//     const createdFile = setupFileCreationWatcher();

//     // Wrap user code in an async function so async/await can be used out of the box.
//     code = `(async() => {
//       ${code}
//     })();`;

//     const log = [];
//     const cmd = spawn('node', ['-e', code]);
//     cmd.stdout.on('data', data => log.push(data));
//     cmd.stderr.on('data', data => log.push(data));

//     cmd.on('close', processCode => {
//       resolve(buildResponse(createdFile, log));
//     });
//   });
// }

const app = express();

app.use(function cors(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  // res.header('Content-Type', 'application/json;charset=utf-8');
  // res.header('Cache-Control', 'private, max-age=300');
  next();
});

app.get('/', (req, res, next) => {
  res.status(200).send('It works!');
});

app.post('/run', upload.single('file'), async (req, res, next) => {
  const code = req.file.buffer.toString();
  try {
    const result = await runCodeInSandbox(code); // await runCodeUsingSpawn(code);
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send({errors: `Error running your code. ${e}`});
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
