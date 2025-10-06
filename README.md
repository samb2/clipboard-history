# 📋 Clipboard History

A simple **cross-platform clipboard manager** built with **Electron**, **TypeScript**, and **SQLite (better-sqlite3)**.  
It runs in the background, captures clipboard history, and provides quick access via a tray menu.

---

## 🚀 Features
- 📌 Tracks your clipboard history (text, etc.).
- 💾 Stores history locally in a fast SQLite database.
- 🖥️ Runs in the system tray (macOS supported, Windows/Linux adaptable).
- 🔍 Simple UI (tray + preload script bridge).
- ⚡ Written in **TypeScript** with **Electron**.
- 🛠️ Easy to build and distribute (DMG packaging for macOS).

---

## 📂 Project Structure
```
clipboard-history/
├── src/
│   ├── main.ts        # Electron main process (app lifecycle, tray, windows)
│   ├── preload.ts     # Secure preload bridge between renderer and main
│   ├── sql-lite.ts    # Database setup using better-sqlite3
├── public/            # Static assets (icons, HTML, CSS, JS)
├── dist/              # Compiled output after build
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/samb2/clipboard-history.git
cd clipboard-history
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the app in development
```bash
npm start
```

---

## 📦 Build

### macOS (DMG package for Apple Silicon)
```bash
npm run build:mac
```

The generated `.dmg` file will be located in the `dist/` output folder.

---

## ⚡ Tech Stack
- [Electron](https://www.electronjs.org/) – Cross-platform desktop framework
- [TypeScript](https://www.typescriptlang.org/) – Strongly typed JavaScript
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) – SQLite3 wrapper
- [electron-builder](https://www.electron.build/) – Packaging and distribution

---

## 🔒 Security Notes
- Preload scripts are used for safe communication between renderer and main processes.
- No external API calls; all data is stored locally in SQLite.

---

## 🖼️ App Icon
Custom `.icns` icon is located in `public/icons/icon.icns`.  
Configured in `package.json` under the `build.mac.icon` field.

---

## 📜 License
This project is licensed under the **ISC License**.
