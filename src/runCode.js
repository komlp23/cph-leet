const cp = require('child_process');
const vscode = require('vscode');
const path = require('path');

/**
 * @param {string} filePath
 * @param {string} language
 * @returns {Promise<string>}
 */
function runCode(filePath, language, outputChannel) {
    const config = vscode.workspace.getConfiguration('cph.language');
    let runCommand;

    switch (language) {
        case 'Python':
            runCommand = config.get('python.run');
            break;
        case 'C++':
            runCommand = config.get('cpp.run');
            break;
        case 'JavaScript':
            runCommand = config.get('javascript.run');
            break;
        default:
            return Promise.reject(new Error('Unsupported language'));
    }

    const fileNameWithoutExt = path.basename(filePath, path.extname(filePath));

    if (runCommand) {
        const runCmd = runCommand.replace('$filename', filePath).replace('$fileNameWithoutExt', fileNameWithoutExt).replace('$fileNameWithoutExt', fileNameWithoutExt);
        
        return new Promise((resolve, reject) => {
            cp.exec(runCmd, (error, stdout, stderr) => {
                if (error) {
                    outputChannel.appendLine(`Exec error: ${stderr}`);
                    reject(`Exec error: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    return Promise.reject(new Error('No valid run command configured.'));
}

module.exports = { runCode };