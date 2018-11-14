// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const app = require('electron').remote.app
const asar = require('asar');
const inject = require('inject-code');
var fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { join } = require('path');
const $ = require('jquery');

// setup paths
let originalAsar;
let signature;
switch (process.platform) {
  case 'darwin':
    originalAsar = '/Applications/Figma.app/Contents/Resources/app.asar';
    signature = '/Applications/Figma.app/Contents/Resources/figments.json';
    break;
  case 'win32':
    // the asar is in a versioned directory on windows,
    // so need to figure out the directory name

    const figmaDir = `${process.env.LOCALAPPDATA}/Figma`;
    const dirs = fs.readdirSync(figmaDir)
      .filter(f =>
        fs.statSync(join(figmaDir, f)).isDirectory()
        && f.startsWith('app-'));
    
    // put the newest version at the top
    dirs.sort().reverse();

    originalAsar = `${figmaDir}/${dirs[0]}/resources/app.asar`;
    signature = `${figmaDir}/${dirs[0]}/resources/figments.txt`;
    break;
  default:
    throw new Error('This platform is not supported at this time.');
}

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
  }
}

let pollInjection = null;

locateInstallation = () => {
  if (fs.existsSync(signature)) {
    show('uninstall');
  }
  else {
    show('install');
  }
}

locateFigmaApp = () => {
  if (fs.existsSync(originalAsar)) {
    show('install');
    locateInstallation();
    pollInjection = setInterval(locateInstallation, 2000);
  }
}


locateFigmaApp();
const pollLocateFigmaApp = setInterval(locateFigmaApp, 2000);

function startInjecting () {
  const userData = app.getPath('userData');
  const backupAsar = `${userData}/${originalAsar}.bk`;

  var input = `${userData}/input`;
  var output = `${userData}/output/app.asar`;

  var targetFile = `${userData}/input/window_manager.js`;
  var insertAfter = "this.webContents.on('dom-ready', () => {";

  var code = fs.readFileSync('./code.js', 'utf8');

  fs.removeSync(output);
  fs.removeSync(input);

  // replace injected packs with backups
  if (fs.existsSync(backupAsar)) {
    fs.unlinkSync(originalAsar);
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


  async function repack() {
    const { stdout, stderr } = await exec('asar pack ./input ./output/app.asar --unpack ./input/*.node');

    fs.renameSync(originalAsar, backupAsar);

    fs.createReadStream(output).pipe(fs.createWriteStream(originalAsar));

    fs.writeJsonSync(signature, {dateInjected: (new Date()).toString()})
  }

  repack();

}

function uninject() {
  const userData = app.getPath('userData');
  const backupAsar = `${userData}/${originalAsar}.bk`;

  if (fs.existsSync(backupAsar)) {
    fs.unlinkSync(originalAsar);
    fs.renameSync(backupAsar, originalAsar);
    fs.unlinkSync(signature);
  }
}

$('#inject').click(startInjecting);
$('#uninject').click(uninject);
$('#locate').click(locate);