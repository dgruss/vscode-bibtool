// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('The BibTool extension is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('bibtool.search', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
    showInputBox();
	});

	context.subscriptions.push(disposable);
}

class MessageItem implements vscode.QuickPickItem {

	label: string;
	description = '';
	detail: string;

	constructor(public entry: string) {
    let entries = entry.replace(RegExp(",\n","g"),"@").split("@");
    let label = entries[0].split("{")[1];
    let title = "";
    let titleindex = entries.findIndex((element)=>(element?.trim().startsWith("title")));
    if (titleindex >= 0)
    {
      title = entries[titleindex];
      delete entries[titleindex];
      title = title.substring(title.indexOf("{")+1,title.lastIndexOf("}")).replace(RegExp("[{}]","g"),"");
    }
    let author = "";
    let authorindex = entries.findIndex((element)=>(element?.trim().startsWith("author")));
    if (authorindex >= 0)
    {
      author = entries[authorindex];
      delete entries[authorindex];
      author = author.substring(author.indexOf("{")+1,author.lastIndexOf("}")).replace(RegExp("[{}]","g"),"");
    }
    this.label = "[" + label + "] " + title;
    this.detail = author + " " + entries.slice(1).join(",").replace(RegExp("[{}]","g"),"");
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
/**
 * Shows a pick list using window.showQuickPick().
 */
export async function showQuickPick(options:string[]) {
  let optionItems:MessageItem[] = [];
  options.forEach(function (value) {optionItems.push(new MessageItem(value));});
	let i = 0;
	const result = await vscode.window.showQuickPick(optionItems, {
    //canPickMany: true,
    ignoreFocusOut: true,
    matchOnDetail: true,
	});
	const resultId = result?result.label.split("]")[0].substring(1):'';
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    const document = editor.document;
    const selection = editor.selection;

    editor.edit(editBuilder => {
      editBuilder.insert(selection.anchor,resultId);
    });
  }
}

/**
 * Shows an input box using window.showInputBox().
 */
export async function showInputBox() {
	const result = await vscode.window.showInputBox({
    value: '',
    placeHolder: 'Type the keywords to search for with BibTool',
  });
  const { execFile } = require('child_process');
  let output:string = "";
  let cwdPath:string = "";
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
  {
    cwdPath = vscode.workspace.workspaceFolders!.at(0)!.uri.path;
  }
  else if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.fileName)
  {
    cwdPath = vscode.window.activeTextEditor.document.fileName;
    if (cwdPath.indexOf('\\') >= 0)
    {
      cwdPath = cwdPath.split("\\").slice(0,-1).join("\\");
    }
    if (cwdPath.indexOf('/') >= 0)
    {
      cwdPath = cwdPath.split("/").slice(0,-1).join("/");
    }
  }
  else
  {
    return;
  }

  const runcmd = execFile("make", ["bib",result], {cwd: cwdPath});
  runcmd.stdout.on('data', (data: Uint8Array) => {
    output += data;
  });
  runcmd.on('close', (code: number) => {
    showQuickPick(output.split("@").slice(1));
  });
}