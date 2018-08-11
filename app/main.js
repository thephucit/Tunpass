const path     = require('path')
const url      = require('url')
const tray     = require('./js/tray')
const appMenu  = require('./js/menu')
const electron = require('electron')
const {
    app,
    BrowserWindow
} = require('electron')

let mainWindow
function createWindow() {
    mainWindow = new BrowserWindow({
        title: app.getName(),
        icon: path.join(__dirname, '../build/icon.ico'),
        width: 430,
        height: 665,
        resizable: false,
        webPreferences: { devTools: false }
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // mainWindow.webContents.openDevTools()

    mainWindow.on('closed', function() {
        mainWindow = null
    })
}

app.on('ready', () => {
    electron.Menu.setApplicationMenu(appMenu)
    createWindow()
    tray.create(mainWindow)
})
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow()
    }
})

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';