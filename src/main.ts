import {
    app,
    BrowserWindow,
    Tray,
    Menu,
    nativeImage,
    ipcMain,
    clipboard,
    screen,
    globalShortcut,
} from "electron";
import * as path from "path";
import {initDatabase, insertStmt, recentSameStmt, listStmt, clearStmt} from "./db/sql-lite";

let tray: Tray;
let win: BrowserWindow;

let timer: ReturnType<typeof setInterval> | null = null;


function createWindow() {
    const preloadPath = path.join(__dirname, "preload.js");

    win = new BrowserWindow({
        width: 360,
        height: 480,
        show: false,
        frame: false,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        vibrancy: "sidebar",
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    // open DevTools automatically so you can watch for errors
    //win.webContents.openDevTools({mode: 'detach'});

    win.loadFile(path.join(__dirname, 'public/index.html'))

    // Hide dock initially (macOS only)
    if (process.platform === "darwin" && app.dock) {
        app.dock.hide();
    }

    win.on("blur", () => {
        if (!win.webContents.isDevToolsOpened()) hidePopup();
    });
    win.on("show", () => {
        win.webContents.send("clipboard:refresh");
    });
}

function createTray() {
    tray = new Tray(nativeImage.createEmpty());
    tray.setTitle("📋");
    tray.setToolTip("Clipboard Manager");

    const toggle = () => {
        if (win.isVisible()) {
            hidePopup();
        } else {
            // When toggling from the tray, you may prefer tray position; otherwise use cursor
            positionWindowNearTray();
            showPopup();
        }
    };

    tray.on("click", toggle);

    tray.on("right-click", () => {
        const menuTemplate: Electron.MenuItemConstructorOptions[] = [
            {
                label: "Show Clipboard", click: () => {
                    positionWindowNearTray();
                    showPopup();
                }
            },
            {type: "separator" as const}
        ];

        menuTemplate.push(
            {type: "separator" as const},
            {label: "Quit", role: "quit"}
        );

        const menu = Menu.buildFromTemplate(menuTemplate);
        tray.popUpContextMenu(menu);
    });
}

function positionWindowNearCursor() {
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    const {width: winW} = win.getBounds();

    // Place near top of current display, centered on cursor X
    let x = Math.round(cursor.x - winW / 2);
    const y = Math.round(display.workArea.y + 8);

    const minX = display.workArea.x + 8;
    const maxX = display.workArea.x + display.workArea.width - winW - 8;
    x = Math.max(minX, Math.min(maxX, x));

    win.setPosition(x, y);
}

function positionWindowNearTray() {
    const trayBounds = tray.getBounds();
    const display = screen.getDisplayNearestPoint({x: trayBounds.x, y: trayBounds.y});
    const {width: winW} = win.getBounds();

    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (winW / 2));
    const y = Math.round(display.workArea.y + 6);
    win.setPosition(x, y);
}

function showPopup() {
    if (process.platform === 'darwin') {
        // Prevent Space switching by making window visible on all workspaces while showing
        win.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
        // For macOS, ensure dock remains hidden
        if (app.dock) {
            app.dock.hide();
        }
    }
    positionWindowNearCursor();
    if (!win.isVisible()) {
        win.show();
    }
    win.setAlwaysOnTop(true, 'screen-saver');
    win.focus();
    win.webContents.send('clipboard:refresh');
}

function hidePopup() {
    if (win.isVisible()) {
        win.hide();
    }
    if (process.platform === 'darwin') {
        // Keep dock hidden after hiding window
        if (app.dock) {
            app.dock.hide();
        }
        // Restore default so the window is not sticky across Spaces after hiding
        //win.setVisibleOnAllWorkspaces(false);
    }
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    initDatabase();

    createWindow();
    createTray();

    // Register global shortcut: Cmd+V on macOS (and Ctrl+V on others)
    globalShortcut.register('Control+V', () => {
        if (!win) return;
        if (win.isVisible()) {
            hidePopup();
        } else {
            showPopup(); // positions near cursor & prevents Space switching
        }
    });
});

app.on("before-quit", () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // Remove any event listeners we added for macOS
    if (process.platform === "darwin") {
        app.removeAllListeners('browser-window-focus');
    }
});

app.on("window-all-closed", () => {
    // You can leave this empty to keep the app alive via the Tray
    // or call app.quit() if you want to exit on macOS too.
});

app.on('will-quit', () => {
    // Unregister all shortcuts (especially CommandOrControl+V)
    globalShortcut.unregisterAll();
});

/* ========= IPC “backend” ========= */
ipcMain.handle('clipboard-read', () => clipboard.readText());
ipcMain.handle('clipboard-write', (_evt, text) => {
    clipboard.writeText(String(text ?? ''));
    return true;
})

// --- IPC: History API ---
ipcMain.handle('history:add', (_e, payload: { content: string; type?: string }) => {
    const content = (payload?.content ?? '').trim();
    const type = payload?.type ?? 'text';
    if (!content) return {ok: false, reason: 'empty'};

    // optional: avoid immediate duplicates (same content + type)
    const dup = recentSameStmt().get(content, type);
    if (dup) return {ok: true, skipped: true};

    const now = Date.now();
    const info = insertStmt().run(content, type, now);
    return {ok: true, id: info.lastInsertRowid, created_at: now, type, content};
});

ipcMain.handle('history:list', (_e, args: { limit?: number; q?: string | null }) => {
    const limit = Math.max(1, Math.min(500, args?.limit ?? 50));
    const q = args?.q?.trim() || null;
    const rows = listStmt().all(q, q, limit);
    return rows;
});

ipcMain.handle('history:clear', () => {
    clearStmt().run();
    return {ok: true};
});