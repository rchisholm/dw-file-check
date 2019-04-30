// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as username from 'username';
import * as dw from './dw-functions';
import * as commands from './dw-commands';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// This code will only be executed once when your extension is activated
	console.log("DW file check activated.");
	vscode.window.showInformationMessage("DW file check activated.");

	let deployExtension = vscode.extensions.getExtension('mkloubert.vscode-deploy-reloaded');
	if(!deployExtension) {
		//console.log("deploy reloaded not found.");
		vscode.window.showErrorMessage("Deploy reloaded not found! DW file check will not function.");
	} else {
		//console.log("deploy.reloaded found!");
		vscode.window.showInformationMessage("Deploy extenson loaded.");
		dw.onStart(context);

		let pullButton: vscode.StatusBarItem;
		let pushButton: vscode.StatusBarItem;
		let checkOutButton: vscode.StatusBarItem;
		let checkInButton: vscode.StatusBarItem;

		pullButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 23);
		pushButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 22);
		checkOutButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 21);
		checkInButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);

		pullButton.command = 'extension.dwPullCurrentFile';
		pushButton.command = 'extension.dwPushCurrentFile';
		checkOutButton.command = 'extension.checkOutCurrentFile';
		checkInButton.command = 'extension.checkInCurrentFile';

		pullButton.text = "Pull File $(arrow-down)";
		pushButton.text = "Push File $(arrow-up)";
		checkOutButton.text = "Check Out $(check)";
		checkInButton.text = "Check In $(lock)";

		pullButton.color = "#bada55";
		pushButton.color = "#00ffff";
		checkOutButton.color="#00ff00";
		checkInButton.color="#ffa500";

		context.subscriptions.push(pullButton, pushButton, checkOutButton, checkInButton);

		pullButton.show();
		pushButton.show();
		checkOutButton.show();
		checkInButton.show();
		
		commands.registerDwCommands(context);
	
	}

}





// this method is called when your extension is deactivated
export function deactivate() {}
