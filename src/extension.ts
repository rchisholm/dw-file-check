/**
 * main extension file
 */
import * as vscode from 'vscode';
import * as dw from './dw-functions';
import * as buttons from './dw-buttons';
import { FileStatusProvider, DwFile } from './dw-file-status-provider';

/**
 * this method is called when your extension is activated
 * @param context vscode extension context
 */
export function activate(context: vscode.ExtensionContext) {

	// This code will only be executed once when your extension is activated
	console.log("DW file check activated.");
	//vscode.window.showInformationMessage("DW file check activated.");

	let deployExtension = vscode.extensions.getExtension('mkloubert.vscode-deploy-reloaded');
	if(!deployExtension) {
		//console.log("deploy reloaded not found.");
		vscode.window.showErrorMessage("Deploy reloaded not found! DW file check will not function.");
	} else {
		//console.log("deploy.reloaded found!");
		//vscode.window.showInformationMessage("Deploy extenson loaded.");
		dw.onStart(context);

		let dwCheckInCurrentFile = vscode.commands.registerCommand('extension.dwCheckInCurrentFile', () => {
			if(vscode.window.activeTextEditor){
				let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;	
				dw.checkInFile(context, currentFilePath);

			} else {
				vscode.window.showInformationMessage("No active text editor.");
			}
		});
	
		let dwCheckOutCurrentFile = vscode.commands.registerCommand('extension.dwCheckOutCurrentFile', () => {	
			if(vscode.window.activeTextEditor){
				let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
				dw.checkOutFile(context, currentFilePath);
			} else {
				vscode.window.showErrorMessage("No active text editor.");
			}
		});
	
		let dwPushCurrentFile = vscode.commands.registerCommand('extension.dwPushCurrentFile', () => {
			dw.startPushCurrentFile(context);
	
		});
	
		let dwPullCurrentFile = vscode.commands.registerCommand('extension.dwPullCurrentFile', () => {
			dw.pullCurrentFile();
		});
	
		let dwCheckFileStatus = vscode.commands.registerCommand('extension.dwCheckFileStatus', (fileOrFolder: vscode.Uri) => {
			dw.checkFileStatus(context, fileOrFolder);
		});
	
		let dwOpenFileOptions = vscode.commands.registerCommand('extension.dwOpenFileOptions', (fileOrFolder: vscode.Uri) => {
			dw.openFileOptions(context, fileOrFolder);
		});

		let dwRefreshTree = vscode.commands.registerCommand('extension.dwRefreshTree', () => {
			fileStatusProvider.refresh();
		});
	
		let dwTreeCheckFileStatus = vscode.commands.registerCommand('extension.dwTreeCheckFileStatus', (node: DwFile) => {
			dw.checkFileStatus(context, vscode.Uri.file(node.filePath));
		});
	
		let dwTreeOpenFileOptions = vscode.commands.registerCommand('extension.dwTreeOpenFileOptions', (node: DwFile) => {
			dw.openFileOptions(context, vscode.Uri.file(node.filePath));
		});
	
		let dwTreeOpenFile = vscode.commands.registerCommand('extension.dwTreeOpenFile', (node: DwFile) => {
			//dw.openFileOptions(context, vscode.Uri.file(node.filePath));
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(node.filePath));
		});
	
		// add the commands
		context.subscriptions.push(
			dwCheckInCurrentFile, 
			dwCheckOutCurrentFile, 
			dwPushCurrentFile, 
			dwPullCurrentFile, 
			dwCheckFileStatus,
			dwOpenFileOptions,
			dwRefreshTree,
			dwTreeCheckFileStatus,
			dwTreeOpenFileOptions,
			dwTreeOpenFile
		);
	
		// add the buttons
		buttons.addDwButtons(context);

		const fileStatusProvider = new FileStatusProvider(context, vscode.workspace.rootPath);
		vscode.window.registerTreeDataProvider("file-status-explorer", fileStatusProvider);
	}
}

/**
 * this method is called when your extension is deactivated
 */
export function deactivate() {}
