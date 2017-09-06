/**
 * Copyright 2017 Google Inc., PhantomJS Authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global document fetch location Blob FormData URL CodeMirror */

(() => {
'use strict';

const textarea = document.querySelector('#code-editor-area');
const puppeteerOutput = document.querySelector('.puppeteer-result-output');
const puppeteerLog = document.querySelector('.puppeteer-result-log');

const editor = CodeMirror.fromTextArea(textarea, {
  lineNumbers: true,
  mode: {name: 'javascript', globalVars: true},
  theme: 'monokai',
  lineWrapping: true,
  allowDropFileTypes: ['text/javascript'],
  autoCloseBrackets: true,
  matchBrackets: true,
  extraKeys: {
    'Ctrl-Space': 'autocomplete',
    'Tab': 'autocomplete'
  },
  keyMap: 'sublime',
  hintOptions: {hint: puppeteerHint, completeSingle: true}
});

// editor.on('drop', (cm, change) => {
//   editor.value = '';
// });

// editor.on('inputRead', (cm, change) => {
//   // hinting logic
//   CodeMirror.showHint(cm, CodeMirror.hint.javascript);
// });

function puppeteerHint(cm) {
  const jsList = CodeMirror.hint.javascript(editor).list;
  const puppeteerList = [];//['browser', 'puppeteer'];
  const dictionary = [...jsList, ...puppeteerList];

  const cur = editor.getCursor();
  const curLine = editor.getLine(cur.line);
  let start = cur.ch;
  let end = start;
  while (end < curLine.length && /[\w$]+/.test(curLine.charAt(end))) {
    ++end;
  }
  while (start && /[\w$]+/.test(curLine.charAt(start - 1))) {
    --start;
  }
  const curWord = curLine.slice(start, end);
  const regex = new RegExp('^' + curWord, 'i');
  return {
    list: dictionary.filter(item => item.match(regex)).sort(),
    from: CodeMirror.Pos(cur.line, start), // eslint-disable-line new-cap
    to: CodeMirror.Pos(cur.line, end) // eslint-disable-line new-cap
  };
}

// CodeMirror.commands.autocomplete = (cm) => {
//   // cm.showHint(cm, CodeMirror.hint.javascript);
//   cm.showHint({hint: CodeMirror.hint.puppeteerHint, completeSingle: true});
// };

// editor.on('keyup', (cm, e) => {
//   const arrows = [37, 38, 39, 40];
//   if (arrows.indexOf(e.keyCode) < 0) {
//     editor.execCommand('autocomplete');
//     // CodeMirror.showHint(cm, CodeMirror.hint.javascript);
//   }
// });

// editor.on('beforeChange', (cm, change) => {
//   if (change.from.line === 0) {
//     change.cancel();
//   }
// });

// editor.on('beforeSelectionChange', (cm, obj)=> {
//   if (obj.ranges[0].anchor.line === 0) {
//     cm.setOption('cursorBlinkRate', -1);
//     // editor.setCursor({line: 3, ch: 0});
//     // editor.focus();
//   } else {
//     cm.setOption('cursorBlinkRate', 530);
//   }
// });
// editor.markText({line: 0, ch: 0}, {line: 1}, {readOnly: true});
// editor.addLineClass(0, 'wrap', 'readonly-line');

async function runCode() {
  const code = editor.getValue();

  if (!/["|']--no-sandbox['|"]/.test(code)) {
    throw Error('This playground requires the --no-sandbox flag when launching Chrome. ' +
                `Please use puppeteer.launch({args: ['--no-sandbox']})`);
  }

  const formData = new FormData();
  formData.append('file', new Blob([code], {type: 'text/javascript'}));

  const url = (location.hostname === 'localhost' ?
      'http://localhost:8080/run' : 'https://backend-dot-try-puppeteer.appspot.com/run');
  const resp = await fetch(url, {method: 'POST', body: formData});
  return await resp.json();
}

function isWorking(button, working = true) {
  const spinner = document.querySelector('.loading-spinner');
  spinner.classList.toggle('active', working);
  button.disabled = working;

  if (working) {
    puppeteerOutput.textContent = '';
    puppeteerLog.textContent = '';
  }
}

const runButton = document.querySelector('#run_button');
runButton.addEventListener('click', e => {
  isWorking(e.target, true);

  runCode().then(json => {
    isWorking(e.target, false);

    if (json.errors) {
      puppeteerLog.textContent = typeof json.errors === 'string' ? json.errors : JSON.stringify(json.errors);
      return;
    }

    if (json.result) {
      const uintArray = new Uint8Array(json.result.buffer.data);
      const blob = new Blob([uintArray], {type: json.result.type});
      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      puppeteerOutput.appendChild(img);
    } else {
      puppeteerOutput.textContent = json.result || '';
    }

    puppeteerLog.textContent = json.log;
  }).catch(err => {
    puppeteerLog.textContent = err;
    isWorking(e.target, false);
  });
});
})();
