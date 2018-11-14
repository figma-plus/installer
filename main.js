const { Menu, shell } = require('electron')
var menubar = require('menubar')

var mb = menubar({
  transparent: true,
  icon: `${process.cwd()}/icon.png`,
  preloadWindow: true,
  width: 220,
  height: 320,
  resizable: false,
  alwaysOnTop: true
})

const reportIssue = () => {
  shell.openExternal('https://github.com/cdes/figments-injector/issues/new');
}

mb.on('ready', function ready () {
  console.log('app is ready')

  const contextMenu = Menu.buildFromTemplate([
    {label: 'Version 1.0', type: 'normal', enabled: false},
    {label: 'Report Issues', type: 'normal', click: reportIssue},
    {type: 'separator'},
    {label: 'Quit', type: 'normal', role: 'quit'}
  ])

  const tray = this.tray;

  tray.on('right-click', function () {
    mb.hideWindow();
    tray.popUpContextMenu(contextMenu);
  })

})

mb.on('after-create-window', () => {
  mb.window.openDevTools({mode: 'detach'});
});