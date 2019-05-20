/**
 * functions called by the commands
 */

import * as dw from './dw-functions';
import * as vscode from 'vscode';
import * as utils from './dw-utils';
import * as status from './dw-status';

/**
 * pull currently open file from server
 */
export function getCurrentFile(){
	if(vscode.window.activeTextEditor){
		let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
		dw.getFile(currentFilePath);
	} else {
		vscode.window.showErrorMessage("No open file.");
	}
}

/**
 * try to push currently open file
 * @param context vscode extension context
 */
export function putCurrentFile(context: vscode.ExtensionContext) {
        // if locked OR checked out by someone else: disallow; warn user they should check the file out.
        // else: allow
        if(vscode.window.activeTextEditor){
			let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
			dw.startPutFile(context, currentFilePath);
        } else {
            vscode.window.showErrorMessage("No open file.");
        }
}

/**
 * try to check in currently open file
 * @param context 
 */
export function checkInCurrentFile(context: vscode.ExtensionContext) {
	if(vscode.window.activeTextEditor){
		let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;	
		dw.startCheckInFile(context, currentFilePath);

	} else {
		vscode.window.showInformationMessage("No active text editor.");
	}
}

/**
 * try to check out currently open file
 * @param context 
 */
export function checkOutCurrentFile(context: vscode.ExtensionContext) {
	if(vscode.window.activeTextEditor){
		let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
		dw.startCheckOutFile(context, currentFilePath);
	} else {
		vscode.window.showErrorMessage("No active text editor.");
	}
}

/**
 * displays the file status and owner of the right-clicked file
 * @param context vscode extension context
 * @param fileOrFolder uri of the right-clicked file
 */
export function checkFileStatus(context: vscode.ExtensionContext, fileOrFolder: vscode.Uri){
	//vscode.window.showInformationMessage('File: ' + fileOrFolder.fsPath);
	if (utils.isFolder(fileOrFolder.fsPath)) {
		vscode.window.showWarningMessage("Directories have no status. Please select an individual file.");
	} else {
		let fileName = utils.getFileName(fileOrFolder.fsPath);
		let selectedFileStatus = status.getFileStatus(context, fileOrFolder.fsPath);
		switch(selectedFileStatus) {
			case 'out':
				vscode.window.showInformationMessage(fileName + " is checked out by " + status.getFileOwner(context, fileOrFolder.fsPath));
			break;
			case 'locked':
				vscode.window.showInformationMessage(fileName + " is checked in. (locked)");
			break;
			case 'unlocked':
				vscode.window.showInformationMessage(fileName + " is not checked in. (unlocked)");
			break;
			default:
				vscode.window.showWarningMessage('No status found for ' + fileName + '. Updating...');
				status.updateFileStatusByPath(context, fileOrFolder.fsPath);
			break;
		}
		vscode.commands.executeCommand("extension.dwRefreshTree");
	}
}

export function treeGetFile(uri: vscode.Uri) {
	dw.getFile(uri.fsPath);
}

export function treePutFile(context: vscode.ExtensionContext, uri: vscode.Uri) {
	dw.startPutFile(context, uri.fsPath);
}

export function treeCheckOutFile(context: vscode.ExtensionContext, uri: vscode.Uri) {
	dw.startCheckOutFile(context, uri.fsPath);
}

export function treeCheckInFile(context: vscode.ExtensionContext, uri: vscode.Uri) {
	dw.startCheckInFile(context, uri.fsPath);
}