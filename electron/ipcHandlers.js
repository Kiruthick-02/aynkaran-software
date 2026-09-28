import { dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

export function initializeIpcHandlers(ipcMainInstance) {
  ipcMainInstance.handle('get:system-info', async () => ({
    platform: process.platform,
    arch: process.arch,
    version: '1.4.0',
    nodeVersion: process.versions.node,
    offlineSecure: true,
  }));

  ipcMainInstance.handle('get:local-cache', async (_event, key) => {
    const dataPath = path.join(process.cwd(), 'offline_store.json');
    if (!fs.existsSync(dataPath)) {
      return null;
    }

    const content = fs.readFileSync(dataPath, 'utf-8');
    const db = JSON.parse(content);
    return db[key] || null;
  });

  ipcMainInstance.handle('set:local-cache', async (_event, { key, value }) => {
    const dataPath = path.join(process.cwd(), 'offline_store.json');
    let db = {};
    if (fs.existsSync(dataPath)) {
      db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    db[key] = value;
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  });

  ipcMainInstance.on('print:pdf', (event, htmlContent) => {
    const options = {
      title: 'Export Certified Dossier Document',
      defaultPath: path.join(process.cwd(), 'aynkaran_export.pdf'),
      filters: [{ name: 'Adobe PDF File', extensions: ['pdf'] }],
    };

    dialog.showSaveDialog(null, options).then((file) => {
      if (!file.canceled && file.filePath) {
        fs.writeFileSync(file.filePath, Buffer.from(htmlContent), 'utf-8');
        event.reply('sys:alert', { status: 'success', message: 'Successfully exported PDF document.' });
      }
    });
  });

  ipcMainInstance.on('db:backup', (event) => {
    const dbFile = path.join(process.cwd(), 'database.json');
    if (!fs.existsSync(dbFile)) {
      return event.reply('sys:alert', { status: 'error', message: 'Root CRM database.json not found.' });
    }

    const options = {
      title: 'Archive CRM Database Backup',
      defaultPath: path.join(process.cwd(), `aynkaran_backup_${Date.now()}.json`),
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    };

    dialog.showSaveDialog(null, options).then((file) => {
      if (!file.canceled && file.filePath) {
        fs.copyFileSync(dbFile, file.filePath);
        event.reply('db:backup:success', { path: file.filePath });
      }
    });
  });
}

export default { initializeIpcHandlers };
