const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
function create() {
  const win = new BrowserWindow({
    width: 1400, height: 900, title: 'الجدول المدرسي الرقمي', icon: path.join(__dirname, 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.maximize();
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}
Menu.setApplicationMenu(null);
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
