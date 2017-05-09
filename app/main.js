const path     = require('path')
const fs       = require('fs')
const electron = require('electron')
const appMenu  = require('./menu')
const config   = require('./config')
const tray     = require('./tray')
const url      = require('url')
const app      = electron.app
const {clipboard, globalShortcut} = require('electron')

require('electron-debug')()
require('electron-context-menu')()

let mainWindow
let isQuitting = false

const isAlreadyRunning = app.makeSingleInstance(() => {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore()
        mainWindow.show()
    }
})

if (isAlreadyRunning) app.quit()

function createMainWindow() {
    const lastWindowState = config.get('lastWindowState')
    const win = new electron.BrowserWindow({
        frame:false,
        resizable: false,
        // transparent: true,
        toolbar: false,
        'skip-taskbar': true,
        title: app.getName(),
        show: false,
        width: 300,
        height: 200,

        maxWidth: 300,
        maxHeight: 200,

        minWidth: 300,
        minHeight: 200,
    })
    win.setAlwaysOnTop(true, 'modal-panel')

    win.on('blur', () => {
        win.hide()
    })

    // win.webContents.openDevTools()

    if (process.platform === 'darwin')
        win.setSheetOffset(40)

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
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

    globalShortcut.register('CommandOrControl+D', () => {
        let text = clipboard.readText('selection')
        clipboard.writeText('', 'selection') // reset copy
        if(text) {
            let coordinates = electron.screen.getCursorScreenPoint()
            win.setPosition(coordinates.x, coordinates.y)
            win.webContents.send('selection', text)
            win.show()
        }
    })
    return win
}

app.on('ready', () => {

    electron.Menu.setApplicationMenu(appMenu)
    mainWindow = createMainWindow()
    tray.create(mainWindow)

})

app.on('activate', () => {
    mainWindow.hide()
})

app.on('before-quit', () => {
    globalShortcut.unregister('CommandOrControl+D')
    globalShortcut.unregisterAll()
    isQuitting = true
    if (!mainWindow.isFullScreen())
        config.set('lastWindowState', mainWindow.getBounds())
})