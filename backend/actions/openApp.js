const { exec } = require('child_process');
const os = require('os');

const browserList = {
  chrome: ['google-chrome', 'chrome', 'chrome.exe'],
  firefox: ['firefox', 'firefox.exe'],
  edge: ['microsoft-edge', 'msedge.exe'],
};

function isWindows() {
  return os.platform() === 'win32';
}

function buildOpenCommand(appName) {
  if (isWindows()) {
    return `start "" "${appName}"`;
  } else {
    return `${appName} &`;
  }
}

function checkAppExists(appNames, callback) {
  const name = Array.isArray(appNames) ? appNames : [appNames];
  let found = false;

  let checked = 0;
  name.forEach(app => {
    exec(`which ${app}`, (err, stdout) => {
      if (stdout.trim()) {
        found = true;
        callback(true, app);
      } else {
        checked++;
        if (checked === name.length && !found) {
          callback(false);
        }
      }
    });
  });
}

function openApp(appCommand, callback) {
  exec(appCommand, (error) => {
    if (error) {
      callback(false, error.message);
    } else {
      callback(true);
    }
  });
}

function handleOpenAppCommand(command, callback) {
  if (command === 'open_browser') {
    const defaultCommand = isWindows() ? 'start chrome' : 'xdg-open https://www.google.com';
    openApp(defaultCommand, (success, message) => {
      callback(success, message || 'Browser default dibuka.');
    });
  }

  else if (command.startsWith('open_browser_')) {
    const target = command.split('_')[2]; 
    const possibleApps = browserList[target];

    if (!possibleApps) {
      return callback(false, `Browser ${target} tidak dikenali.`);
    }

    checkAppExists(possibleApps, (found, foundApp) => {
      if (!found) {
        return callback(false, `Browser ${target} tidak ditemukan di sistem.`);
      }

      const cmd = buildOpenCommand(foundApp);
      openApp(cmd, (success, msg) => {
        callback(success, msg || `Browser ${target} berhasil dibuka.`);
      });
    });
  }

  else if (command === 'open_youtube') {
   
    const url = isWindows() ? 'start https://youtube.com' : 'xdg-open https://youtube.com';
    openApp(url, (success, msg) => {
      callback(success, msg || 'YouTube dibuka di browser.');
    });
  }

  else if (command === 'open_notepad') {
    const cmd = isWindows() ? 'start notepad' : 'gedit &';
    openApp(cmd, (success, msg) => {
      callback(success, msg || 'Notepad dibuka.');
    });
  }

  else {
    callback(false, 'Perintah tidak dikenali.');
  }
}

module.exports = { handleOpenAppCommand };
