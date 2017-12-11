const path     = require('path')
const fs       = require('fs')
const electron = require('electron')
const appMenu  = require('./js/menu')
const config   = require('./js/config')
const tray     = require('./js/tray')
const url      = require('url')
const app      = electron.app
const {clipboard, globalShortcut} = require('electron')
const AutoLaunch = require('auto-launch')

require('electron-debug')()
require('electron-context-menu')()

let mainWindow
let isQuitting = false

let shortcut = ''
let app_path = ''
let os = process.platform
if(os.includes('win')) {
    shortcut = 'Control+Q'
    app_path = path.join(app.getAppPath().replace('\\resources\\app.asar', ''), app.getName()) + '.exe'
}
if(os.includes('linux') || os.includes('ubuntu')) {
    shortcut = 'Control+Q'
    app_path = path.join(app.getAppPath().replace('\\resources\\app.asar', ''), app.getName()) + '.deb'
}
if(os.includes('darwin')) {
    shortcut = 'Command+D'
    app_path = '/Applications/Tunlookup.app'
}

var tunLookup = new AutoLaunch({
    name: 'Tunlookup',
    path: app_path,
});

tunLookup.enable();

tunLookup.isEnabled()
.then(function(isEnabled){
    if(isEnabled) return;
    tunLookup.enable();
})
.catch(function(err){});

const isAlreadyRunning = app.makeSingleInstance(() => {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore()
        mainWindow.show()
    }
})

if (isAlreadyRunning) app.quit()

function createMainWindow() {
    const win = new electron.BrowserWindow({
        icon: path.join(__dirname, '../build/icon.ico'),
        frame: false,
        transparent: true,
        skipTaskbar: true,
        toolbar: false,
        title: app.getName(),
        show: false,
        width: 350, height: 'auto',
        radii: [5,5,5,5],
        webPreferences: { devTools: false }
    })
    win.setAlwaysOnTop(true, 'modal-panel')
    win.setMenu(null)
    win.on('blur', () => win.hide() )

    //win.webContents.openDevTools()

    if (process.platform === 'darwin')
        win.setSheetOffset(40)

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'first.html'),
        protocol: 'file:',
        slashes: true
    }))

    win.on('close', e => {
        if (!isQuitting) {
            e.preventDefault()
            if (process.platform === 'darwin')
                app.hide()
            else
                win.hide()
        }
    })

    win.on('page-title-updated', e => {
        e.preventDefault()
    })

    globalShortcut.register(shortcut, () => {
        let text = clipboard.readText('selection')
        // clipboard.writeText('', 'selection')
        // let coordinates = electron.screen.getCursorScreenPoint()
        // win.setPosition(coordinates.x, coordinates.y)
        win.webContents.send('selection', text)
        win.show()
    })
    return win
}

app.on('ready', () => {
    // electron.Menu.setApplicationMenu(appMenu)
    mainWindow = createMainWindow()
    tray.create(mainWindow)
})

app.on('activate', () => mainWindow.hide() )

app.on('before-quit', () => {
    globalShortcut.unregister(shortcut)
    globalShortcut.unregisterAll()
    isQuitting = true
})