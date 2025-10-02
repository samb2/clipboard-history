import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('clipboardAPI', {
    readText: () => ipcRenderer.invoke('clipboard-read'),
    writeText: (txt: string) => ipcRenderer.invoke('clipboard-write', txt),
    onRefresh: (cb: () => void) => ipcRenderer.on('clipboard:refresh', cb),
});

// New: history API
contextBridge.exposeInMainWorld('historyAPI', {
    add: (content: string, type = 'text') =>
        ipcRenderer.invoke('history:add', { content, type }),

    list: (limit = 50, q: string | null = null) =>
        ipcRenderer.invoke('history:list', { limit, q }),

    clear: () => ipcRenderer.invoke('history:clear'),
});
