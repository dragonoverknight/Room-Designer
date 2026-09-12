// creates a new browser window and loads the index.html file

const {app, BrowserWindow} = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile('index.html');
}

// initializes the app and creates the window when ready

app.whenReady().then(createWindow);

// quits the app when all windows are closed

app.on('window-all-closed', () => {
  app.quit();
});
