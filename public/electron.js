const { app, BrowserWindow, ipcMain } = require("electron");
const { download } = require("electron-dl");

const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        icon: __dirname + "icon.png",
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL(
        isDev
            ? "http://localhost:3000"
            : `file://${path.join(__dirname, "../build/index.html")}`
    );

    ipcMain.on("download", (event, info) => {
        download(mainWindow, info.url, info.properties).then(dl => {
            mainWindow.webContents.send("download complete", dl.getSavePath());
        });
    });

    if (isDev) {
        // Open the DevTools.
        //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});
