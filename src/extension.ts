/**
 * main extension file
 */
import * as vscode from 'vscode';
import * as commands from './dw-commands';
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

	//console.log("deploy.reloaded found!");
	//vscode.window.showInformationMessage("Deploy extenson loaded.");
	dw.onStart(context);

	let dwCheckInCurrentFile = vscode.commands.registerCommand('extension.dwCheckInCurrentFile', () => {
		commands.checkInCurrentFile(context);
	});

	let dwCheckOutCurrentFile = vscode.commands.registerCommand('extension.dwCheckOutCurrentFile', () => {	
		commands.checkOutCurrentFile(context);
	});

	let dwPushCurrentFile = vscode.commands.registerCommand('extension.dwPushCurrentFile', () => {
		commands.putCurrentFile(context);

	});

	let dwPullCurrentFile = vscode.commands.registerCommand('extension.dwPullCurrentFile', () => {
		commands.getCurrentFile();
	});

	let dwCheckFileStatus = vscode.commands.registerCommand('extension.dwCheckFileStatus', (fileOrFolder: vscode.Uri) => {
		commands.checkFileStatus(context, fileOrFolder);
	});

	// let dwOpenFileOptions = vscode.commands.registerCommand('extension.dwOpenFileOptions', (fileOrFolder: vscode.Uri) => {
	// 	dw.openFileOptions(context, fileOrFolder);
	// });

	let dwRefreshTree = vscode.commands.registerCommand('extension.dwRefreshTree', () => {
		fileStatusProvider.refresh();
	});

	let dwTreeGetFile = vscode.commands.registerCommand('extension.dwTreeGetFile', (node: DwFile) => {
		commands.treeGetFile(vscode.Uri.file(node.filePath));
	});

	let dwTreePutFile = vscode.commands.registerCommand('extension.dwTreePutFile', (node: DwFile) => {
		commands.treePutFile(context, vscode.Uri.file(node.filePath));
	});

	let dwTreeCheckOutFile = vscode.commands.registerCommand('extension.dwTreeCheckOutFile', (node: DwFile) => {
		commands.treeCheckOutFile(context, vscode.Uri.file(node.filePath));
	});

	let dwTreeCheckInFile = vscode.commands.registerCommand('extension.dwTreeCheckInFile', (node: DwFile) => {
		commands.treeCheckInFile(context, vscode.Uri.file(node.filePath));
	});

	let dwTreeOpenFile = vscode.commands.registerCommand('extension.dwTreeOpenFile', (node: DwFile) => {
		//dw.openFileOptions(context, vscode.Uri.file(node.filePath));
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(node.filePath));
	});

	let dwTestPutFile = vscode.commands.registerCommand('extension.dwTestPutFile', (node: DwFile) => {
		//dw.openFileOptions(context, vscode.Uri.file(node.filePath));
		dw.testPutFile(node.filePath);
	});

	let dwTestGetFile = vscode.commands.registerCommand('extension.dwTestGetFile', (node: DwFile) => {
		//dw.openFileOptions(context, vscode.Uri.file(node.filePath));
		dw.testGetFile(node.filePath);
	});

	// add the commands
	context.subscriptions.push(
		dwCheckInCurrentFile, 
		dwCheckOutCurrentFile, 
		dwPushCurrentFile, 
		dwPullCurrentFile, 
		dwCheckFileStatus,
		dwRefreshTree,
		dwTreeGetFile,
		dwTreePutFile,
		dwTreeCheckOutFile,
		dwTreeCheckInFile,
		dwTreeOpenFile,
		dwTestPutFile,
		dwTestGetFile
	);

	// add the buttons
	buttons.addDwButtons(context);

	const fileStatusProvider = new FileStatusProvider(context, vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider("file-status-explorer", fileStatusProvider);
	
}

/**
 * this method is called when your extension is deactivated
 */
export function deactivate() {}
