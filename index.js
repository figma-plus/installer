const asar = require('asar');
const inject = require('inject-code');
var fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { join } = require('path');

// setup paths
let originalAsar;
switch (process.platform) {
  case 'darwin':
    originalAsar = '/Applications/Figma.app/Contents/Resources/app.asar';
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
    break;
  default:
    throw new Error('This platform is not supported at this time.');
}
const backupAsar = `${originalAsar}.bk`;

var input = './input';
var output = "./output/app.asar";

var targetFile = './input/window_manager.js';
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
}

repack();
