/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { contextBridge, ipcRenderer } = require('electron');

// Secure context bridge for communicating between React frontend and safe native APIs
contextBridge.exposeInMainWorld('aynkaranDesktop', {
  send: (channel, data) => {
    const validSendChannels = ['app:status', 'print:pdf', 'whatsapp:payload', 'db:backup'];
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validReceiveChannels = ['update:available', 'update:downloaded', 'db:backup:success', 'sys:alert'];
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: (channel, data) => {
    const validInvokeChannels = ['get:system-info', 'get:local-cache', 'set:local-cache'];
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
});
