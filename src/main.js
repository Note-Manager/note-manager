import * as electron from 'electron';
import {app, BrowserWindow} from 'electron';

import initFileEventHandlers from "./ipc/FileEventHandlers";
import initLoggingEventHandlers from "./ipc/LoggingEventHandlers";
import {SupportedLanguages} from "./contants/Enums";
import * as path from "node:path";
import {readFile} from "./utils/FileUtils";
import initTabEventHandlers from "./ipc/TabEventHandlers";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}



const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 860,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  initMenu(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function initMenu(browserWindow) {
  const menu = electron.Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            browserWindow.webContents.send('newTab');
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const file = electron.dialog.showOpenDialogSync(browserWindow, {
              title: "Select file to open",
              message: "Select file to open",
              buttonLabel: "Open",
              filters: [{extensions: ["*"], name: "All Files"}],
              properties: ['openFile'],
            });

            if(file?.length === 1) {
              browserWindow.webContents.send('openTab', {
                name: path.basename(file[0]),
                file: file[0],
                content: readFile(file[0])
              });
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            browserWindow.webContents.send('saveTab');
          }
        }
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            browserWindow.webContents.send('undoTab');
          }
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            browserWindow.webContents.send('redoTab');
          }
        },
        {
          label: 'Format',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            browserWindow.webContents.send('formatTab');
          }
        }
      ],
    },
    {
      label: 'Language',
      submenu: Object.keys(SupportedLanguages).filter(k => typeof SupportedLanguages[k] === "object").map(key => {
        return {
          label: SupportedLanguages[key].label,
          click: () => {
            browserWindow.webContents.send('setLanguage', SupportedLanguages[key]);
          }
        };
      })
    }
  ]);

  if(!app.isPackaged) {
      const menuItem = new electron.MenuItem({
          label: 'Developer',
          submenu: [
              {
                  label: 'Reload',
                  accelerator: 'CmdOrCtrl+R',
                  click: () => {
                      browserWindow.webContents.reload();
                  }
              },
              {
                  label: 'Developer Tools',
                  accelerator: 'CmdOrCtrl+I',
                  click: () => {
                      browserWindow.webContents.openDevTools();
                  }
              }
          ]
      });

      menu.append(menuItem);
  }
  browserWindow.setMenu(menu);
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

initLoggingEventHandlers();
initFileEventHandlers();
initTabEventHandlers();