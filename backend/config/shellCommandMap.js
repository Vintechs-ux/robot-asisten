const commandMap = {
    "open_word": "start winword",         
    "open_steam": "start steam",
    "open_browser": "start chrome https://google.com",
    "shutdown": "shutdown /s /t 1",
    "open_taskmgr": "taskmgr",
    "open_chrome": "start chrome",
    "open_firefox": "start firefox",
    "open_edge": "start msedge",
    "open_youtube": "start https://youtube.com",
    "open_vscode": "start code",
    "open_notepad": "start notepad",
    "open_calculator": "start calc",
    "open_calendar": "start mspaint",
    "open_notepad": "start notepad",
    "open_calculator": "start calc",
    "open_calendar": "start mspaint",
    "open_notepad": "start notepad",
    "open_firefox": "start firefox",
    "open_brave": "start brave",
    "open_opera": "start opera",
    "open_vivaldi": "startvivaldi",
    "open_chrome_dev": "start chrome --incognito",
    "open_chrome_canary": "start chrome-canary",
    "open_chrome_beta": "start chrome-beta",
    

    "close_chrome": "taskkill /IM chrome.exe /F",
    "close_firefox": "taskkill /IM firefox.exe /F",
    "close_edge": "taskkill /IM msedge.exe /F",
    "close_word": "taskkill /IM winword.exe /F",
    "close_steam": "taskkill /IM steam.exe /F",
    "close_vscode": "taskkill /IM code.exe /F",
    "close_notepad": "taskkill /IM notepad.exe /F",
    "close_calculator": "taskkill /IM calc.exe /F",
    "close_calendar": "taskkill /IM mspaint.exe /F",
    "close_taskmgr": "taskkill /IM taskmgr.exe /F",
    "close_browser": "taskkill /IM chrome.exe /F",
    "close_youtube": "taskkill /IM chrome.exe /F",
    
  };
  
  module.exports = commandMap;
  