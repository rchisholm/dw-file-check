/**
 * contains functions for manipulating/reading file status and owner
 */
import * as vscode from 'vscode';
import { isReadOnly, getFileName } from './dw-utils';

/**
 * check all files for local .LCK files, and read-only status
 * @param context vscode extension context
 */
export function updateWorkspaceStatus(context: vscode.ExtensionContext){
	vscode.workspace.findFiles("**/*", "**/{node_modules,tns_modules,platforms,.vscode}/**")
	.then((uris) => {
		if(uris.length > 0) {
			uris.forEach((uri) => {
				updateFileStatusByURI(context, uri);
			});
		}
	});
}

/**
 * updates the status of a single file by URI
 * @param context 
 * @param uri 
 */
export function updateFileStatusByURI(context: vscode.ExtensionContext, uri: vscode.Uri){
	let lockFileUri = vscode.Uri.file(uri.fsPath + ".LCK");
	if(lockFileUri) {
		vscode.workspace.openTextDocument(lockFileUri).then((file) =>{
			let ownerName = file.getText().split("||")[0];
			let filePath = lockFileUri.fsPath.split(".LCK")[0];
			context.workspaceState.update("status:" + filePath, "out");
			context.workspaceState.update("owner:" + filePath, ownerName);
			//console.log(getFileName(filePath) + " checked out by " + ownerName);
		},() =>{
			if(isReadOnly(uri.fsPath)){
				context.workspaceState.update("status:" + uri.fsPath, "locked");
				//console.log(getFileName(uri.fsPath) + " is locked.");
			} else {
				context.workspaceState.update("status:" + uri.fsPath, "unlocked");
				//console.log(getFileName(uri.fsPath) + " is unlocked.");
			}
		});
	}
}

/**
 * updates the status of a single file by fsPath
 * @param context vscode extension context
 * @param path fs path of the file to update
 */
export function updateFileStatusByPath(context: vscode.ExtensionContext, path: string){
	let lockFileUri = vscode.Uri.file(path + ".LCK");
	if(lockFileUri) {
		vscode.workspace.openTextDocument(lockFileUri).then((file) =>{
			let ownerName = file.getText().split("||")[0];
			let filePath = lockFileUri.fsPath.split(".LCK")[0];
			context.workspaceState.update("status:" + filePath, "out");
			context.workspaceState.update("owner:" + filePath, ownerName);
			//console.log(getFileName(filePath) + " checked out by " + ownerName);
		},()=> {
			if(isReadOnly(path)){
				context.workspaceState.update("status:" + path, "locked");
				//console.log(getFileName(path) + " is locked.");
			} else {
				context.workspaceState.update("status:" + path, "unlocked");
				//console.log(getFileName(path) + " is unlocked.");
			}
		});
	}
}


/**
 * gets the status of a single file by fsPath
 * @param path fs path of the file
 */
export async function getFileStatusByPath(path: string): Promise<string> {
	let lockFileUri = vscode.Uri.file(path + ".LCK");
	let status: string = "";
	await vscode.workspace.openTextDocument(lockFileUri).then(() =>{
		// return Promise.resolve("out");
		status = "out";
	},()=> {
		if(isReadOnly(path)){
			// return Promise.resolve("locked");
			status = "locked";
		} else {
			// return Promise.resolve("unlocked");
			status = "unlocked";
		}
	});
	// console.error("no status returned for " + getFileName(path));
	return Promise.resolve(status);
}

/**
 * gets the owner of a single file by fsPath
 * @param path fs path of the file
 */
export async function getFileOwnerByPath(path: string): Promise<string>{
	let lockFileUri = vscode.Uri.file(path + ".LCK");
	let ownerName: string = "";
	await vscode.workspace.openTextDocument(lockFileUri).then((file) =>{
		ownerName = file.getText().split("||")[0];
	},()=> {
		//rejected
		ownerName = "";
	});
	// console.error("no owner returned for " + getFileName(path));
	return Promise.resolve(ownerName);
}

/**
 * get file status from workspace state
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function getFileStatus(context: vscode.ExtensionContext, path: string): string{
	//updateFileStatusByPath(context, path);
	return context.workspaceState.get("status:" + path) as string;
	//return getFileStatusByPath(path);
}

/**
 * get file owner from workspace state
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function getFileOwner(context: vscode.ExtensionContext, path: string): string{
	//updateFileStatusByPath(context, path);
	return context.workspaceState.get("owner:" + path) as string;
	//return getFileOwnerByPath(path);
}

/**
 * set file status in workspace state
 * @param context vscode extension context
 * @param path fs path of the file
 * @param status the status: "out", "locked", or "unlocked"
 */
export function setFileStatus(context: vscode.ExtensionContext, path: string, status: string){
	context.workspaceState.update("status:" + path, status);
}

/**
 * set file owner in workspace state
 * @param context vscode extension context
 * @param path fs path of the file
 * @param owner file owner name
 */
export function setFileOwner(context: vscode.ExtensionContext, path: string, owner: string){
	context.workspaceState.update("owner:" + path, owner);
}