const { Menu, shell, app, dialog } = require('electron')
const unhandled = require('electron-unhandled');
const {openNewGitHubIssue, debugInfo} = require('electron-util');
const prompt = require('electron-prompt');
const store = require('./store');

const dev = false;


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

const toggleLocalList = (event) => {
  if(event.checked) {
    prompt({
        title: 'Enter JSON',
        label: 'JSON Array (You could wreck your plugins installation, proceed with caution!)',
        value: '[]',
        inputAttrs: {
            type: 'text',
            require: true,
        },
        height: 150,
    })
    .then((r) => {
        if(r === null) {
          devMenu.items[devMenu.length - 1].checked = false;
          tray.setContextMenu(null);
          mb.showWindow();
        } else {
          store.set('devMode', true);
          store.set('localList', r);
        }
    })
    .catch(console.error);
  }
  else {
    store.delete('devMode');
    store.delete('localList');
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

const devMenuItems = [
  {type: 'separator'},
  {label: 'Inject Local Plugins List (Dev)', type: 'checkbox', checked: store.get('devMode', false), click: toggleLocalList}
];

const baseMenu = Menu.buildFromTemplate(menuItems);
const devMenu = Menu.buildFromTemplate(menuItems.concat(devMenuItems));

mb.on('ready', function ready () {
  
  tray = this.tray;
  
  tray.on('right-click', function (event) {
    mb.hideWindow();
    if (event.altKey) {      
      tray.popUpContextMenu(devMenu);
    }
    else {
      tray.popUpContextMenu(baseMenu);
    }
  })
  
  mb.showWindow();
  
})

mb.on('after-create-window', () => {
  if(dev) {
    mb.window.openDevTools({mode: 'detach'});
  }
});