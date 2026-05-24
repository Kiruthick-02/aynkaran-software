/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { autoUpdater } = require('electron-updater');

// Hooking Electron autoUpdater into Hugging Face Release registries
autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Querying Aynkaran update artifacts...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Found active update v' + info.version);
  // Communicate to window processes
  global.mainWindow && global.mainWindow.webContents.send('update:available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Downloaded release successfully.');
  global.mainWindow && global.mainWindow.webContents.send('update:downloaded', info);
});

module.exports = { autoUpdater };
