const { convertLeetCodeUrl } = require("./utils.js");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const { Builder, By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");

/**
 * @param {string} curl
 * @param {string} workspacePath
 * @returns {Promise<{inputArr: string[], outputArr: string[]}>}
 */
const fetchTestCase = async (curl, workspacePath, outputChannel) => {
  outputChannel.clear();
  const testCaseFolderPath = path.join(workspacePath, "testCase");

  if (!fs.existsSync(testCaseFolderPath)) {
    fs.mkdirSync(testCaseFolderPath);
  }

  const inputArr = [];
  const outputArr = [];
  let inputOutputArray;
  const url = convertLeetCodeUrl(curl);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Fetching Test Cases...",
      cancellable: false,
    },
    async (progress) => {
      try {
        progress.report({ increment: 0, message: "Launching browser..." });

        // Use the chromedriver path provided by the package
        const service = new chrome.ServiceBuilder(chromedriver.path);
        const driver = new Builder()
          .forBrowser("chrome")
          .setChromeService(service)
          .build();

        progress.report({ increment: 30, message: "Opening URL..." });
        await driver.get(url);

        progress.report({ increment: 60, message: "Extracting test cases..." });

        // Wait for the required elements
        await driver.wait(
          async () => {
            const elements = await driver.findElements(By.css("pre, .example-block"));
            return elements.length > 0;
          },
          60000,
          "Timeout: Unable to locate test case elements"
        );

        // Extract test case content
        const elements = await driver.findElements(By.css("pre, .example-block"));
        inputOutputArray = await Promise.all(
          elements.map(async (el) => await el.getText())
        );

        progress.report({ increment: 90, message: "Closing browser..." });
        await driver.quit();

        progress.report({
          increment: 100,
          message: "Test cases fetched and saved successfully!",
        });
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to fetch test cases: ${error.message}`
        );
      }
    }
  );

  const inputRegex = /Input:\s*([\s\S]*?)(?=\nOutput:|$)/g;
  const outputRegex = /Output:\s*([\s\S]*?)(?=\nExplanation:|$|\n)/g;

  let counter = 1;
  for (const caseData of inputOutputArray) {
    const inputMatch = [...caseData.matchAll(inputRegex)];
    const outputMatch = [...caseData.matchAll(outputRegex)];

    if (inputMatch.length > 0 && outputMatch.length > 0) {
      for (let i = 0; i < inputMatch.length; i++) {
        const input = inputMatch[i][1].trim();
        const output = outputMatch[i] ? outputMatch[i][1].trim() : "No Output";

        const inputFilePath = path.join(
          testCaseFolderPath,
          `input_${counter}.txt`
        );
        const outputFilePath = path.join(
          testCaseFolderPath,
          `output_${counter}.txt`
        );

        fs.writeFileSync(inputFilePath, input, "utf-8");
        fs.writeFileSync(outputFilePath, output, "utf-8");

        inputArr.push(input);
        outputArr.push(output);

        outputChannel.appendLine(
          `Test case ${counter} saved as /testCase/input_${counter}.txt and /testCase/output_${counter}.txt`
        );
        counter++;
      }
    } else {
      outputChannel.appendLine("No input-output pairs found");
    }
    outputChannel.show();
  }

  return { inputArr, outputArr };
};

module.exports = fetchTestCase;
