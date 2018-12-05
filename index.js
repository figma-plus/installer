const { Menu, shell, app, dialog, ipcMain } = require('electron')
const unhandled = require('electron-unhandled');
const {openNewGitHubIssue, debugInfo} = require('electron-util');
const prompt = require('electron-prompt');
const store = require('./store');
const isDev = require('electron-is-dev');

const dev = isDev;


unhandled({
  showDialog: true,
	reportButton: error => {
		openNewGitHubIssue({
			user: 'cdes',
			repo: 'figments-injector',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});

if(dev) {
  require('electron-debug')();
}


var menubar = require('menubar')

const path =  require('path');
const rootFolder = process.env.NODE_ENV === 'development'
? process.cwd()
: path.resolve(app.getAppPath(), './');

var mb = menubar({
  transparent: true,
  icon: `${rootFolder}/trayiconTemplate.png`,
  preloadWindow: true,
  width: 280,
  height: 360,
  resizable: false,
  alwaysOnTop: dev,
})

const reportIssue = () => {
  shell.openExternal('https://github.com/cdes/figments-injector/issues/new');
}

const goToWebsite = () => {
  shell.openExternal('https://github.com/cdes/figments-injector/');
}

const about = () => {
  dialog.showMessageBox({
    type: 'info',
    message: 'Created by Ahmed Al-Haddad @cdes',
    buttons: ['Close']
  });
}

const toggleLocalPluginsManager = (event) => {
  if(event.checked) {
    prompt({
        title: 'Local Plugins Manager',
        label: 'Enter local server that serves the plugin manager packages',
        value: 'http://localhost:8080',
        inputAttrs: {
            type: 'text',
            require: true,
        },
        height: 150,
    })
    .then((r) => {
        if(r === null) {
          mb.showWindow();
        } else {
          store.set('useLocalPluginsManager', true);
          store.set('localPluginsManagerUrl', r);
        }
    })
    .catch(console.error);
  }
  else {
    store.delete('useLocalPluginsManager');
    store.delete('localPluginsManagerUrl');
  }
}

const toggleDevMode = (event) => {
  if(event.checked) {
    store.set('devMode', true);
  }
  else {
    store.delete('devMode');
  }
}

let tray = null;

const menuItems = [
  {label: 'About', type: 'normal', click: about},
  {label: 'Website', type: 'normal', click: goToWebsite},
  {label: 'Report Issues', type: 'normal', click: reportIssue},
  {type: 'separator'},
  {label: 'Quit', type: 'normal', role: 'quit'},
  {label: `Version ${app.getVersion()}`, type: 'normal', enabled: false},
];

const getUseLocalPlugin = () => store.get('useLocalPluginsManager', false);
const getDevMode = () => store.get('devMode', false);

const devMenuItems = [
  {type: 'separator'},
  {label: 'Developer Mode in Plugin Manager', type: 'checkbox', checked: false, click: toggleDevMode},
  {label: 'Local Plugins Manager', type: 'checkbox', checked: false, click: toggleLocalPluginsManager},
];

const baseMenu = Menu.buildFromTemplate(menuItems);
const devMenu = Menu.buildFromTemplate(menuItems.concat(devMenuItems));

mb.on('ready', function ready () {
  
  tray = this.tray;
  
  tray.on('right-click', function (event) {
    openSettings(tray);
  })

  ipcMain.on('openSettings', () => {
    openSettings(tray);
  });
  
  mb.showWindow();
  
})

function openSettings (tray) {
  mb.hideWindow();
  devMenu.items[devMenu.items.length - 1].checked = getUseLocalPlugin();
  devMenu.items[devMenu.items.length - 2].checked = getDevMode();
  tray.popUpContextMenu(devMenu);
}

mb.on('after-create-window', () => {
  if(dev) {
    mb.window.openDevTools({mode: 'detach'});
  }
});