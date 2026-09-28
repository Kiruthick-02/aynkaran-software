import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;

autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Querying Aynkaran update artifacts...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Found active update v' + info.version);
  if (global.mainWindow) {
    global.mainWindow.webContents.send('update:available', info);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Downloaded release successfully.');
  if (global.mainWindow) {
    global.mainWindow.webContents.send('update:downloaded', info);
  }
});

export { autoUpdater };
