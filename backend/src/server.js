'use strict';

const express = require('express');
const {spawn} = require('child_process');
// const bodyParser = require('body-parser');
const upload = require('multer')();

const vm = require('vm');
// const puppeteer = require('../node_modules/puppeteer'); // Need puppeteer in this context, when we spawn node.

// async function runCode(code) {
//   // console.log(code);
//   // return safeEval('const x = 5', puppeteer);

//   // const logger = {log: console.log, error: console.error, info: console.info, warn: console.warn};

//   code = `
//   const log = [];

//   console.log = (...args) => log.push(args);

//   // Wrap user's code in an async function.
//   (async() => {
//     async function runUserCode() {
//       ${code}
//     };
//     const result = await runUserCode();

//     return {result, log: log.join('\\n')};
//   })();
//   `;

//   // Promiseify expression no matter what user returns.
//   const promise = Promise.resolve();
//   return await promise.then(() => vm.runInNewContext(code, {puppeteer, require, console}));
//   // const result = eval(code);
//   // return sandbox[resultKey]
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
  let code = req.file.buffer.toString();

  // try {
  //   const result = await runCode(code);
  //   res.status(200).send(result);
  // } catch (e) {
  //   return res.status(500).send({log: `Error running your code. ${e}`});
  // }

  // console.log(global);

  // code = `
  // (function(require) {
  //   ${code}
  // })`;
  // const result = vm.runInThisContext(code)(require);
  // console.log(result);

  const cmd = spawn('node', ['-e', code]);

  const log = [];
  const errors = [];
  cmd.stdout.on('data', (data) => {
    log.push(data);
  });

  cmd.stderr.on('data', (data) => {
    errors.push(data);
  });

  cmd.on('close', (code) => {
    // console.log(`child process exited with code ${code}`);
    const respObj = {
      log: log.join('\n')
    };
    if (errors.length) {
      respObj.errors = errors.join('\n');
    }
    res.status(200).send(respObj);
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
