const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const fetchTestCase = require("./src/fetchTestCases.js");
const { runCode } = require("./src/runCode.js");
const { compareOutputs } = require("./src/compareOutput.js");

/**
 * @param {vscode.ExtensionContext} context
 */

let outputChannel;
function activate(context) {
  console.log("Extension is activated.");
  outputChannel = vscode.window.createOutputChannel("CPH");

  let fetchTestCasesCommand = vscode.commands.registerCommand(
    "cph.fetchTestCases",
    async () => {
      const problemURL = await vscode.window.showInputBox({
        placeHolder: "Enter the LeetCode problem URL",
      });
      const workspacePath = vscode.workspace.rootPath;

      if (!workspacePath) {
        vscode.window.showErrorMessage(
          "No workspace directory found. Please open a folder in VS Code."
        );
        return;
      }
      if (problemURL) {
        if (!problemURL.includes("leetcode")) {
          vscode.window.showErrorMessage(
            "Invalid URL: The URL must be from LeetCode."
          );
          return;
        }
        try {
          const { inputArr, outputArr } = await fetchTestCase(
            problemURL,
            workspacePath,
            outputChannel
          );

          vscode.window.showInformationMessage(
            "Test cases fetched successfully!"
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to fetch test cases: ${error.message}`
          );
        }
      }
    }
  );

  let runCodeCommand = vscode.commands.registerCommand(
    "cph.runCode",
    async () => {
      outputChannel.clear();
      outputChannel.show();
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No file is currently open.");
        return;
      }
      const filePath = editor.document.fileName;
      const fileExtension = path.extname(filePath);

      let language;
      if (fileExtension === ".py") {
        language = "Python";
      } else if (fileExtension === ".cpp") {
        language = "C++";
      } else if (fileExtension === ".js") {
        language = "JavaScript";

      } else {
        vscode.window.showErrorMessage(
          "Unsupported file type. Please open a Python, C++ or JavaScript file."
        );
        return;
      }

      try {
        const output = await runCode(filePath, language, outputChannel);
        const testCaseNumber = await vscode.window.showInputBox({
          placeHolder: "Enter test case number (e.g., 1, 2, 3)",
          validateInput: (value) => {
            return /^[0-9]+$/.test(value)
              ? null
              : "Please enter a valid number";
          },
        });
        const directoryPath = path.join(vscode.workspace.rootPath, "testCase");
        const expectedOutputFiles = fs
          .readdirSync(directoryPath)
          .filter((file) => file.startsWith(`output_${testCaseNumber}`));

        if (expectedOutputFiles.length === 0) {
          vscode.window.showWarningMessage(
            `No expected output files found (files starting with output_${testCaseNumber}).`
          );
          return;
        }

        let testPassed = true;
        for (const expectedFile of expectedOutputFiles) {
          const expectedOutput = fs.readFileSync(
            path.join(directoryPath, expectedFile),
            "utf-8"
          );
          const comparisonResult = compareOutputs(output, expectedOutput);
          outputChannel.clear();
          outputChannel.appendLine("=== Test Case Results ===");
          if (comparisonResult) {
            outputChannel.appendLine(`Test Case ${testCaseNumber}: ✅ PASSED`);
            outputChannel.appendLine("Expected Output:");
            outputChannel.appendLine(expectedOutput);
            outputChannel.appendLine("Actual Output:");
            outputChannel.appendLine(output);
            outputChannel.appendLine("-------------------------");
          } else {
            outputChannel.appendLine(`Test Case ${testCaseNumber}: ❌ FAILED`);
            outputChannel.appendLine("Expected Output:");
            outputChannel.appendLine(expectedOutput);
            outputChannel.appendLine("Actual Output:");
            outputChannel.appendLine(output);
            outputChannel.appendLine("-------------------------");
            testPassed = false;
          }
        }
        outputChannel.show();

        if (testPassed) {
          vscode.window.showInformationMessage("Test cases passed!");
        } else {
          vscode.window.showErrorMessage("Test cases failed.");
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Error: ${err}`);
      }
    }
  );
  context.subscriptions.push(fetchTestCasesCommand);
  context.subscriptions.push(runCodeCommand);
}
function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};