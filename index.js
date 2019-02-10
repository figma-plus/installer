const { Menu, shell, app, dialog, ipcMain, BrowserWindow } = require('electron')
const unhandled = require('electron-unhandled');
const {openNewGitHubIssue, debugInfo} = require('electron-util');
const prompt = require('electron-prompt');
const store = require('./store');
const isDev = require('electron-is-dev');

const dev = isDev;

// Prevent window being garbage collected
let mainWindow;

function onClosed() {
	// Dereference the window
	// For multiple windows store them in an array
	mainWindow = null;
}

unhandled({
  showDialog: true,
	reportButton: error => {
		openNewGitHubIssue({
			user: 'cdes',
			repo: 'figma-plugins-desktop-injector',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});

if(dev) {
  require('electron-debug')();
}


const path =  require('path');
const rootFolder = process.env.NODE_ENV === 'development'
? process.cwd()
: path.resolve(app.getAppPath(), './');

const appMenu = [];

if (process.platform === 'darwin') {
  appMenu.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })
}

function createMainWindow() {
	const win = new BrowserWindow({
    width: 280,
    height: 360,
    resizable: false,
    frame: false
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu));
	mainWindow = createMainWindow();
});