const Config = require('electron-config')

module.exports = new Config({
    defaults: {
        lastWindowState: {
            width: 1210,
            height: 640,
            minWidth: 1210,
            minHeight: 640
        }
    }
})