const fs = require('fs');
const path = require('path');
const { generateShellCommand } = require('../utils/shellCommandGenerator');

const COMMANDS_FILE = path.join(__dirname, 'generatedCommands.json');


let shellCommands = {};
if (fs.existsSync(COMMANDS_FILE)) {
    shellCommands = JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf8'));
}

const getOrGenerateCommand = async (appName) => {

    if (shellCommands[appName]) {
        return shellCommands[appName];
    }


    const newCommand = await generateShellCommand(appName);
    

    shellCommands[appName] = newCommand;
    fs.writeFileSync(COMMANDS_FILE, JSON.stringify(shellCommands, null, 2));

    return newCommand;
};

module.exports = {
    getOrGenerateCommand
}; 