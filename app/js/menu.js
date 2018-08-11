const {
    Menu,
    shell
} = require('electron')

const template = [{
        label: 'Edit',
        submenu: [{
                role: 'undo'
            },
            {
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                role: 'cut'
            },
            {
                role: 'copy'
            },
            {
                role: 'paste'
            },
            {
                role: 'delete'
            },
            {
                role: 'selectall'
            }
        ]
    },
]

if (process.platform === 'darwin') {
    template.unshift({
        label: 'Tunpass',
        submenu: [
            {
                role: 'about'
            },
            {
                role: 'hide'
            },
            {
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                role: 'quit'
            }
        ]
    })
}

module.exports = Menu.buildFromTemplate(template)