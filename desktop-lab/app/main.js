const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { spawn } = require('child_process');
const http = require('http');

let currentApiBase = null;

let logStream = null;
function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    if (!logStream) {
      const p = path.join(app.getPath('userData'), 'applab-desktop.log');
      logStream = fs.createWriteStream(p, { flags: 'a' });
    }
    logStream.write(line);
  } catch {}
  // Also keep console output for dev runs
  try { console.log(message); } catch {}
}

ipcMain.on('get-api-base-sync', (event) => {
  event.returnValue = currentApiBase;
});

function getHealthUrl(apiBase) {
  // apiBase: http://127.0.0.1:NNNN/api
  try {
    const u = new URL(apiBase);
    u.pathname = '/health';
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return 'http://127.0.0.1:42420/health';
  }
}

function waitForBackendHealth(apiBase, { timeoutMs = 45000 } = {}) {
  const healthUrl = getHealthUrl(apiBase);
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed > timeoutMs) {
        return reject(new Error(`Backend health timeout (${timeoutMs}ms): ${healthUrl}`));
      }

      const req = http.get(healthUrl, (res) => {
        // consume data
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          return resolve(true);
        }
        setTimeout(attempt, 300);
      });

      req.on('error', () => {
        setTimeout(attempt, 300);
      });
    };

    attempt();
  });
}

function stripMenus(win) {
  // Make sure we don't show the default "File / Edit / View" menu bar on Windows/Linux.
  try { win.setMenu(null); } catch {}
  try { win.setMenuBarVisibility(false); } catch {}
  try { win.removeMenu(); } catch {}
}

function parseDotenv(contents) {
  const out = {};
  for (const rawLine of String(contents).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readDotenvIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return parseDotenv(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function ensureConfig() {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      // fallthrough to recreate
    }
  }

  // Seed defaults from backend .env (packaged) or workspace backend-lab/.env (dev)
  const backendEnvPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', '.env')
    : path.join(__dirname, '..', '..', '..', 'backend-lab', '.env');
  const backendEnv = readDotenvIfExists(backendEnvPath) || {};
  const envHost = backendEnv.DB_HOST || backendEnv.HOST || process.env.DB_HOST || process.env.HOST;
  const envUser = backendEnv.DB_USER || process.env.DB_USER;
  const envPassword = backendEnv.DB_PASSWORD || process.env.DB_PASSWORD;
  const envName = backendEnv.DB_NAME || process.env.DB_NAME;
  const envPort = backendEnv.DB_PORT || process.env.DB_PORT;

  const defaultConfig = {
    db: {
      host: envHost || 'LIBA-SERVIDOR',
      port: envPort ? Number(envPort) : 3306,
      user: envUser || 'servidor_liba',
      // Intentionally only default from external env/.env, not hard-coded
      password: envPassword || '',
      name: envName || 'lab'
    },
    api: {
      preferredPort: 42420,
      bindHost: "127.0.0.1"
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  return defaultConfig;
}

function findFreePort(startPort) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        server.close(() => tryPort(port + 1));
      });
      server.listen({ port, host: '127.0.0.1' }, () => {
        server.close(() => resolve(port));
      });
    };
    tryPort(startPort);
  });
}

function getBackendEntry() {
  // Packaged apps: backend is under process.resourcesPath/backend/server.js
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', 'server.js');
  }
  // Dev: run workspace backend-lab
  return path.join(__dirname, '..', '..', '..', 'backend-lab', 'server.js');
}

function startBackend({ port, bindHost, db }) {
  const entry = getBackendEntry();

  logLine(
    `[desktop] starting backend entry=${entry} port=${port} bindHost=${bindHost} ` +
      `dbHost=${db?.host} dbPort=${db?.port} dbUser=${db?.user} dbName=${db?.name}`
  );

  const child = spawn(process.execPath, [entry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      DESKTOP_MODE: '1',
      NODE_ENV: 'production',
      PORT: String(port),
      BIND_HOST: bindHost,
      // backend supports DB_HOST or HOST
      HOST: db.host,
      DB_HOST: db.host,
      DB_PORT: String(db.port || 3306),
      DB_USER: db.user,
      DB_PASSWORD: db.password,
      DB_NAME: db.name
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  child.stdout.on('data', (d) => logLine(`[backend] ${String(d).trimEnd()}`));
  child.stderr.on('data', (d) => logLine(`[backend:err] ${String(d).trimEnd()}`));

  child.on('exit', (code) => {
    logLine(`[backend] exited with code ${code}`);
  });

  return child;
}

async function createMainWindow(apiBase) {
  logLine(`[desktop] creating window apiBase=${apiBase}`);
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--apiBase=${apiBase}`]
    }
  });

  stripMenus(win);

  try {
    win.setTitle(`LIBA Software ${app.getVersion()}`);
  } catch {}

  // Re-apply in case something re-attaches the default menu after creation.
  try { win.once('ready-to-show', () => stripMenus(win)); } catch {}
  try { win.on('show', () => stripMenus(win)); } catch {}
  try { win.on('focus', () => stripMenus(win)); } catch {}

  const indexPath = path.join(__dirname, 'renderer', 'index.html');
  if (app.isPackaged) {
    await win.loadFile(indexPath);
  } else {
    if (fs.existsSync(indexPath)) {
      await win.loadFile(indexPath);
    } else {
      await win.loadURL('http://localhost:4200');
    }
  }
}

let backendProcess = null;

app.whenReady().then(async () => {
  logLine(`[desktop] version=${app.getVersion()} platform=${process.platform} isPackaged=${app.isPackaged}`);

  // Remove default app menu (File/Edit/View). Keep default behavior on macOS.
  try {
    if (process.platform !== 'darwin') {
      Menu.setApplicationMenu(null);
    }
  } catch {}

  try {
    if (process.platform !== 'darwin') {
      const appMenu = Menu.getApplicationMenu();
      logLine(`[desktop] appMenu is ${appMenu ? 'present' : 'null'}`);
    }
  } catch {}

  // Also strip any menus from every window that gets created.
  try {
    if (process.platform !== 'darwin') {
      app.on('browser-window-created', (_event, win) => stripMenus(win));
    }
  } catch {}

  const config = ensureConfig();

  logLine(`[desktop] userData=${app.getPath('userData')}`);
  logLine(`[desktop] configPath=${getConfigPath()}`);

  if (!config?.db?.host) {
    dialog.showErrorBox('Configuración incompleta', `Falta db.host. Edita: ${getConfigPath()}`);
    app.quit();
    return;
  }

  const preferredPort = Number(config?.api?.preferredPort || 42420);
  const bindHost = String(config?.api?.bindHost || '127.0.0.1');
  const port = await findFreePort(preferredPort);

  backendProcess = startBackend({ port, bindHost, db: config.db });
  const apiBase = `http://127.0.0.1:${port}/api`;

  // Make apiBase available to preload via IPC
  currentApiBase = apiBase;

  try {
    await waitForBackendHealth(apiBase, { timeoutMs: 45000 });
    logLine('[desktop] backend health OK');
  } catch (e) {
    logLine(`[desktop] backend health FAILED: ${e?.message || e}`);
    dialog.showErrorBox(
      'No se pudo iniciar el backend',
      `La API local no respondió a tiempo. En algunos PCs el primer arranque puede tardar 30–60 segundos (por antivirus/IO).\n\nRevisa el log: ${path.join(app.getPath('userData'), 'applab-desktop.log')}`
    );
  }

  await createMainWindow(apiBase);
});

app.on('window-all-closed', () => {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch {}
  }
  app.quit();
});
