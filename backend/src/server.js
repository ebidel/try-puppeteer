'use strict';

const fs = require('fs');
const express = require('express');
const {spawn} = require('child_process');
const mime = require('mime');
const upload = require('multer')();

const vm = require('vm');
// const puppeteer = require('../node_modules/puppeteer'); // Need puppeteer in this context, when we spawn node.

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  // code = `
  // ((require) => {
  //   ${code}
  // })`;

  // // const result = vm.runInThisContext(code)(require);
  // const result = await vm.runInNewContext(code, {require});
  // console.log(result);
  // res.status(200).send(result);

  // TODO: do more than this to cleanup + prevent malicious deeds.
  const createdFile = new Promise((resolve, reject) => {
    const watcher = fs.watch('./', {recursive: true}, (eventType, filename) => {
      watcher.close();
      resolve(filename);
    });
  });

  try {
    const cmd = spawn('node', ['-e', code]);

    const log = [];
    cmd.stdout.on('data', data => {
      log.push(data);
    });

    cmd.stderr.on('data', data => {
      if (!res.headersSent) {
        res.status(200).send({errors: data.toString()});
      }
    });

    cmd.on('close', async code => {
      try {
        const respObj = {log: log.join('\n')};

        // Wait a max of 150ms for a file to be created. The race is necessary
        // because fileCreated will never resolve if the user's code never
        // attemptes to create a file.
        const filename = await Promise.race([createdFile, sleep(150)]);
        if (filename) {
          respObj.result = {
            type: mime.lookup(filename),
            buffer: fs.readFileSync(filename)
          };
          fs.unlinkSync(filename); // Remove the file that the user created.
        }
        res.status(200).send(respObj);
      } catch (e) {
        throw e;
      }
    });
  } catch (e) {
    res.status(500).send({errors: e});
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
