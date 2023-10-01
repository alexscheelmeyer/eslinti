#!/usr/bin/env node

const { ESLint } = require("eslint");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const runEslint = async () => {
  const eslint = new ESLint();
  const pathToFiles = process.argv[2] || "./";

  let results = await eslint.lintFiles([pathToFiles]);

  for (const result of results) {
    let { filePath, messages } = result;

    for (let i = 0; i < messages.length; i++) {
      const { line, column, ruleId, message: errorMessage, severity, fix } = messages[i];

      const severityText = severity === 1 ? 'Warning' : 'Error';

      console.log(`File: ${filePath}`);
      console.log(`Line: ${line}, Column: ${column}`);
      console.log(`Severity: ${severityText}`);
      console.log(`Rule: ${ruleId}`);
      console.log(`Message: ${errorMessage}`);
      
      if (fix) {
        const answer = await askQuestion('Would you like to autofix this issue? (y/n) ');

        if (answer.toLowerCase() === 'y') {
          // Re-lint and fix only the current file
          const eslintFixer = new ESLint({ fix: true });
          const fixResults = await eslintFixer.lintFiles([filePath]);
          console.log(fixResults);
          await ESLint.outputFixes(fixResults);

          // Update the result and messages to continue from the next unfixed issue
          result.messages = fixResults[0].messages;
          messages = result.messages;
          i = -1;  // Resetting the loop to start from the first message again
        }
      }

      await askQuestion('Press Enter to continue to the next issue...');
    }
  }
};

runEslint().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
