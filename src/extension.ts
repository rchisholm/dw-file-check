/**
 * main extension file
 */
import * as vscode from 'vscode';
import * as dw from './dw-functions';
import * as commands from './dw-commands';
import * as buttons from './dw-buttons';
import { FileStatusProvider } from './dw-file-status-provider';

/**
 * this method is called when your extension is activated
 * @param context vscode extension context
 */
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
		//vscode.window.showInformationMessage("Deploy extenson loaded.");
		dw.onStart(context);
		commands.registerDwCommands(context);
		buttons.addDwButtons(context);
		vscode.window.registerTreeDataProvider("file-status-explorer", new FileStatusProvider(vscode.workspace.rootPath));
	}
}

/**
 * this method is called when your extension is deactivated
 */
export function deactivate() {}
