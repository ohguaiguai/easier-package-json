// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
const path = require('path');
const fs = require('fs');

function provideDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
) {
  const fileName = document.fileName;
  const workDir = path.dirname(fileName);
  const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position);

  // console.log('====== 进入 provideDefinition 方法 ======');
  // console.log('fileName: ' + fileName); // 当前文件完整路径
  // console.log('workDir: ' + workDir); // 当前文件所在目录
  // console.log('word: ' + word); // 当前光标所在单词
  // console.log('line: ' + line.text); // 当前光标所在行
  // 只处理package.json文件
  if (/\/package\.json$/.test(fileName)) {
    const json = document.getText();
    // console.log('json', json);
    if (
      // 'types/cript'.replace(/\//g,'\\/') -> "types\\/cript" ->
      // new RegExp("(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?types\\/cript[\\s\\S]*?\\}, 'gm') ->
      // /"(dependencies|devDependencies)":\s*?\{[\s\S]*?types\/cript[\s\S]*?\}/gm
      new RegExp(
        `"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(
          /\//g,
          '\\/'
        )}[\\s\\S]*?\\}`,
        'gm'
      ).test(json)
    ) {
      let destPath = `${workDir}/node_modules/${word.replace(
        /"/g,
        ''
      )}/package.json`;
      if (fs.existsSync(destPath)) {
        // new vscode.Position(0, 0) 表示跳转到某个文件的第一行第一列
        return new vscode.Location(
          vscode.Uri.file(destPath),
          new vscode.Position(0, 0)
        );
      }
    }
  }
}

function provideHover(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
) {
  const fileName = document.fileName;
  const workDir = path.dirname(fileName);
  const word = document.getText(document.getWordRangeAtPosition(position));
  console.log('--------------进入provideHover方法');
  console.log(fileName, workDir, word);
  if (/\/package\.json$/.test(fileName)) {
    const json = document.getText();
    if (
      new RegExp(
        `"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(
          /\//g,
          '\\/'
        )}[\\s\\S]*?\\}`,
        'gm'
      ).test(json)
    ) {
      let destPath = `${workDir}/node_modules/${word.replace(
        /"/g,
        ''
      )}/package.json`;
      if (fs.existsSync(destPath)) {
        const content = require(destPath);
        console.log('hover已生效');
        // hover内容支持markdown语法
        return new vscode.Hover(
          `* **名称**：${content.name}\n* **版本**：${content.version}\n* **许可协议**：${content.license}`
        );
      }
    }
  }
}
export function activate(context: vscode.ExtensionContext) {
  // 注册鼠标悬停提示
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('json', {
      provideHover,
    })
  );
  // 注册如何实现跳转到定义，第一个参数表示仅对json文件生效
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(['json'], {
      provideDefinition,
    })
  );
}
export function deactivate() {}
