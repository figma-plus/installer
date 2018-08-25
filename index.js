const asar = require('asar');
const inject = require('inject-code');
var fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// setup paths

var originalAsar = '/Applications/Figma.app/Contents/Resources/app.asar';
var backupAsar = '/Applications/Figma.app/Contents/Resources/app.asar.bk';

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
