const { Menu, shell, systemPreferences } = require('electron')
var menubar = require('menubar')

const icon = systemPreferences.isDarkMode() ? 'icon-dark' : 'icon-light';

var mb = menubar({
  transparent: true,
  icon: `${process.cwd()}/${icon}.png`,
  preloadWindow: true,
  width: 280,
  height: 360,
  resizable: false,
  alwaysOnTop: true
})

const reportIssue = () => {
  shell.openExternal('https://github.com/cdes/figments-injector/issues/new');
}

let tray = null;

mb.on('ready', function ready () {
  console.log('app is ready')

  const contextMenu = Menu.buildFromTemplate([
    {label: 'Version 1.0', type: 'normal', enabled: false},
    {label: 'Report Issues', type: 'normal', click: reportIssue},
    {type: 'separator'},
    {label: 'Quit', type: 'normal', role: 'quit'}
  ])

  tray = this.tray;

  tray.on('right-click', function () {
    mb.hideWindow();
    tray.popUpContextMenu(contextMenu);
  })

})

mb.on('after-create-window', () => {
  mb.window.openDevTools({mode: 'detach'});
});

mb.on('hide', () => {
  tray.setImage(`${process.cwd()}/${icon}.png`);
});

mb.on('show', () => {
  tray.setImage(`${process.cwd()}/icon-dark.png`);
});