// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { app, dialog } = require('electron').remote;
const asar = require('asar');
const path = require('path');
const inject = require('inject-code');
var fs = require('fs-extra');
var originalFs = require('original-fs');
const util = require('util');
const { join } = require('path');
const $ = require('jquery');
const psList = require('ps-list');
const fkill = require('fkill');
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;

// setup paths
let originalAsar;
let signature;
let figmaAppLocation = '/Applications/Figma.app';
const rootFolder = process.env.NODE_ENV === 'development'
? process.cwd()
: path.resolve(app.getAppPath(), './');

const checkInjection = () => {
  if (fs.existsSync(signature)) {
    show('uninstall');
  }
  else if (fs.existsSync(originalAsar)){
    show('install');
  }
  else {
    show('locating');
  }
}

function setupPaths(location) {

  if(process.platform === 'darwin') {
    figmaAppLocation = location ? location : figmaAppLocation;
  }
  else if(process.platform === 'win32') {
    // the asar is in a versioned directory on windows,
    // so need to figure out the directory name

    const figmaDir = `${app.getPath('appData')}/Figma`;

    const dirs = fs.readdirSync(figmaDir)
      .filter(f =>
        fs.statSync(join(figmaDir, f)).isDirectory()
        && f.startsWith('app-'));

    dirs.sort().reverse();

    figmaAppLocation = location ? location : `${figmaDir}/${dirs[0]}`;
  }

  switch (process.platform) {
    case 'darwin':
      originalAsar = `${figmaAppLocation}/Contents/Resources/app.asar`;
      signature = `${figmaAppLocation}/Contents/Resources/figments.json`;
      break;
    case 'win32':
      originalAsar = `${figmaAppLocation}/resources/app.asar`;
      signature = `${figmaAppLocation}/resources/figments.json`;
      break;
    default:
      throw new Error('This platform is not supported at this time.');
  }

  $('#path').text(figmaAppLocation);

  checkInjection();
}

setupPaths();

function hideAll() {
  $('#locating').removeClass('show');
  $('#install').removeClass('show');
  $('#uninstall').removeClass('show');
  $('#error').removeClass('show');
}

function show(id) {
  const element = $(`#${id}`);
  if(!element.hasClass('show')) {
    hideAll();
    $(`#${id}`).addClass('show');
    $(`#${id} button`).removeClass();
  }
}

let pollInjection = null;

locateFigmaApp = () => {
  if (fs.existsSync(originalAsar) && !fs.existsSync(signature)) {
    $('#path').text(figmaAppLocation);
    show('install');
    checkInjection();
    pollInjection = setInterval(checkInjection, 2000);
  }
}


locateFigmaApp();
const pollLocateFigmaApp = setInterval(locateFigmaApp, 2000);

async function checkFigmaBeforeRunning(task) {
  const ps = await psList();
  const figmaProcess = ps.filter(p => p.name === 'Figma');
  const figmaIsRunning = figmaProcess.length > 0;

  if (figmaIsRunning) {
    dialog.showMessageBox({
      type: 'info',
      message: 'Figma app is still open, you must quit it first.  Make sure to save your progress before quitting Figma.',
      buttons: ['Quit Figma', 'Cancel']
    }, (resp) => {
      console.log(figmaProcess, resp);
      
      if (resp === 0) {
        // User selected 'Quit Figma'
        fkill(figmaProcess[0].pid).then(() => {
          task();
          runFigma();
        });
      }
      else {
        $('button').removeClass();
      }
    });
  }
  else {
    task();
    runFigma();
  }
}

function runFigma() {
  setTimeout(() => {
    if(process.platform === 'darwin') {
      exec(`open ${figmaAppLocation}`);
    }
    else if (process.platform === 'win32') {
      execFile(`${app.getPath('appData')}/Figma/Figma.exe`);
    }
  }, 2000);
}

function startInjecting () {
  const userData = app.getPath('userData');
  const backupAsar = `${originalAsar}.bk`;

  var input = `${userData}/input`;
  var output = `${userData}/output/app.asar`;

  var targetFile = `${userData}/input/window_manager.js`;
  var insertAfter = "this.webContents.on('dom-ready', () => {";
  
  var code = fs.readFileSync(`${rootFolder}/code.js`, 'utf8');

  if (fs.existsSync(output)) fs.unlinkSync(output);

  if (fs.existsSync(input)) fs.removeSync(input);

  // replace injected packs with backups
  if (fs.existsSync(backupAsar)) {
    if (fs.existsSync(originalAsar)) fs.unlinkSync(originalAsar);
    fs.renameSync(backupAsar, originalAsar);
  }

  // bring figma files
  asar.extractAll(originalAsar, input);

  // inject code
  inject(
    code,
    {
      into: targetFile,
      after: insertAfter,
      sync: true,
      contentType: 'code',
      newLine: 'auto'
    }
  );


  asar.createPackageWithOptions(input, output, {unpackDir: `${input}/*.node`}, writePacked);

  function writePacked() {
    if (fs.existsSync(output)) {
      fs.renameSync(originalAsar, backupAsar);
      originalFs.copyFileSync(output, originalAsar);
      fs.writeJsonSync(signature, {dateInjected: (new Date()).toString()})
      checkInjection();
    }
    else {
      dialog.showErrorBox('File not found', output);
    }
  }
}

function uninject() {
  const backupAsar = `${originalAsar}.bk`;

  if (fs.existsSync(backupAsar)) {
    fs.unlinkSync(originalAsar);
    fs.renameSync(backupAsar, originalAsar);
    fs.unlinkSync(signature);
    checkInjection();
  }
}

function locate() {

  let dialogTitle = "Select Figma Folder";
  let properties = ["openDirectory"];
  let filters = [];

  if(process.platform === 'darwin') {
    dialogTitle = "Select Figma.app";
    properties = ["openFile"];
    filters = [{ name: 'App', extensions: ['app'] }]
  }

  dialog.showOpenDialog({
    title:dialogTitle,
    properties: properties,
    filters: filters,
  }, (paths) => {
      if (paths === undefined){
          console.log("No destination folder selected");
          return;
      } else {
          setupPaths(paths[0]);
      }
  });
}

$('#inject').click(() => {
  $('#inject').addClass('loading outline');
  checkFigmaBeforeRunning(startInjecting);
});

$('#uninject').click(() => {
  $('#uninject').addClass('loading outline');
  checkFigmaBeforeRunning(uninject);
});

$('#locate').click(() => {
  $('#locate').addClass('loading');
  locate();
});