/**
 * contains the functions used in the commands for dw-file-check
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as username from 'username';

/**
 * check all files for local .LCK files, and read-only status
 * @param context vscode extension context
 */
export function onStart(context: vscode.ExtensionContext){
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
			//console.log(filePath);
			context.workspaceState.update("status:" + filePath, "out");
			context.workspaceState.update("owner:" + filePath, ownerName);
			console.log(filePath + " checked out by " + ownerName);
		},() =>{
			if(isReadOnly(uri.fsPath)){
				context.workspaceState.update("status:" + uri.fsPath, "locked");
				console.log(uri.fsPath + " is locked.");
			} else {
				context.workspaceState.update("status:" + uri.fsPath, "unlocked");
				console.log(uri.fsPath + " is unlocked.");
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
			//console.log(filePath);
			context.workspaceState.update("status:" + filePath, "out");
			context.workspaceState.update("owner:" + filePath, ownerName);
			console.log(filePath + " checked out by " + ownerName);
		},()=> {
			if(isReadOnly(path)){
				context.workspaceState.update("status:" + path, "locked");
				console.log(path + " is locked.");
			} else {
				context.workspaceState.update("status:" + path, "unlocked");
				console.log(path + " is unlocked.");
			}
		});
	}
}

/**
 * gets the status of a single file by fsPath
 * @param path fs path of the file
 */
export function getFileStatusByPath(path: string): string {
	let lockFileUri = vscode.Uri.file(path + ".LCK");
	vscode.workspace.openTextDocument(lockFileUri).then((file) =>{
		return "out";
	},()=> {
		if(isReadOnly(path)){
			return "locked";
		} else {
			return "unlocked";
		}
	});
	console.log("error - no status returned for " + path);
	return "unlocked";
}

/**
 * gets the owner of a single file by fsPath
 * @param path fs path of the file
 */
export function getFileOwnerByPath(path: string): string{
	let lockFileUri = vscode.Uri.file(path + ".LCK");
	vscode.workspace.openTextDocument(lockFileUri).then((file) =>{
		let ownerName = file.getText().split("||")[0];
		//console.log(filePath);
		return ownerName;
	},()=> {
		//rejected
		return "";
	});
	console.log("error - no owner returned for " + path);
	return "";
}

/**
 * get file status from workspace state
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function getFileStatus(context: vscode.ExtensionContext, path: string){
	//updateFileStatusByPath(context, path);
	return context.workspaceState.get("status:" + path);
	//return getFileStatusByPath(path);
}

/**
 * get file owner from workspace state
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function getFileOwner(context: vscode.ExtensionContext, path: string){
	//updateFileStatusByPath(context, path);
	return context.workspaceState.get("owner:" + path);
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

/**
 * return true if file is readonly
 * @param path fs path of the file
 */
export function isReadOnly(path: string){
	return ((fs.statSync(path).mode & 146) === 0);
}

/**
 * set file to readonly
 * @param path fs path of the file
 */
export function setReadOnly(path:string){
	if(!isReadOnly(path)){
		fs.chmodSync(path, fs.statSync(path).mode & 292);
	}
}

/**
 * remove readonly status from file
 * @param path fs path of the file
 */
export function removeReadOnly(path:string){
	if(isReadOnly(path)){
		fs.chmodSync(path, fs.statSync(path).mode | 146);
	}
}

/**
 * pull currently open file from server
 */
export function pullCurrentFile(){
	let deploy = vscode.extensions.getExtension('mkloubert.vscode-deploy-reloaded');
	// is the ext loaded and ready?
	if(deploy){
		if( deploy.isActive === false ){
			deploy.activate().then(
				function(){
					console.log( "Deploy activated");
					// comment next line out for release
					// findCommand(); 
					vscode.commands.executeCommand("extension.deploy.reloaded.pullFile");
				},
				function(){
					console.log( "Deploy activation failed");
				}
			);   
		} else {
			vscode.commands.executeCommand("extension.deploy.reloaded.pullFile");
		}
	}
}

/**
 * push currently open file to server
 */
export function pushCurrentFile(){
	let deploy = vscode.extensions.getExtension('mkloubert.vscode-deploy-reloaded');
	// is the ext loaded and ready?
	if(deploy){
		if( deploy.isActive === false ){
			deploy.activate().then(
				function(){
					console.log( "Deploy activated");
					// comment next line out for release
					// findCommand(); 
					vscode.commands.executeCommand("extension.deploy.reloaded.pullFile");
				},
				function(){
					console.log( "Deploy activation failed");
				}
			);   
		} else {
			vscode.commands.executeCommand("extension.deploy.reloaded.deployFile");
		}
	}
}

/**
 * create ".LCK" file with current user as owner
 * @param path fs path of the file
 */
export function createLockFile(path: string){
	let lockFilePath = path + ".LCK";
	username().then(name => {
		fs.writeFile(lockFilePath, name.toLowerCase() + "||" + name.toLowerCase() + "@marian.org", function (err) {
			if (err) { throw err; }
			//console.log('.LCK file saved!');
		});
	});
}

/**
 * remove ".LCK" file
 * @param path fs path of the file
 */
export function deleteLockFile(path: string){
	let lockFilePath = path + ".LCK";
	fs.unlink(lockFilePath, function (err) {
		if (err) { throw err; }
		//console.log('.LCK file deleted!');
	});
}

/**
 * try to check in file
 * @param context vscode extension context
 * @param currentFilePath fs path of the file
 */
export function checkInFile(context: vscode.ExtensionContext, currentFilePath: string){
	let currentFileStatus = getFileStatus(context, currentFilePath);
	
	if(currentFileStatus === "out") {
		let currentFileOwner = getFileOwner(context, currentFilePath);
		username().then(name => {
			if(currentFileOwner === name.toLowerCase()){
				// file is checked out by you.
				// vscode.window.showInformationMessage("File is checked out by you!");
				finishCheckIn(context, currentFilePath);
			}else{
				// file is checked out by someone else
				vscode.window.showWarningMessage("File is checked out by " + currentFileOwner + ". Override his/her checkout?", ...["Confirm", "Cancel"]).then(choice => {
					if(choice === "Confirm"){
						finishCheckIn(context, currentFilePath);
					}
				});
			}
		});
	}else if(currentFileStatus === "locked"){
		//file is locked
		vscode.window.showWarningMessage("File is locked. Already checked in.");
		//do nothing
	}else if(currentFileStatus === "unlocked"){
		//file is unlocked
		//vscode.window.showInformationMessage("File is unlocked.");
		finishCheckIn(context, currentFilePath);
	}
}

/**
 * successfully check in file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function finishCheckIn(context: vscode.ExtensionContext, path: string){

	//remove local .LCK file 
	deleteLockFile(path);

	//need to remove remote .LCK file (maybe not)

	//set file status
	setFileStatus(context, path, "locked");
	setFileOwner(context, path, "");

	//push to remote
	pushCurrentFile();

	//set readonly on local
	setReadOnly(path);
	
	vscode.window.showInformationMessage("File checked in.");
	return null;
}

/**
 * try to check out file
 * @param context vscode extension context
 * @param currentFilePath fs path of the file
 */
export function checkOutFile(context: vscode.ExtensionContext, currentFilePath: string) {
	let currentFileStatus = getFileStatus(context, currentFilePath);

	if(currentFileStatus === "out") {
		let currentFileOwner = getFileOwner(context, currentFilePath);
		username().then(name => {
			if(currentFileOwner === name.toLowerCase()){
				// file is checked out by you.
				vscode.window.showInformationMessage("File is already checked out by you.");
			}else{
				// file is checked out by someone else
				vscode.window.showWarningMessage("File is checked out by " + currentFileOwner + ". Override his/her checkout?", 
					...["Confirm", "Cancel"]).then(choice => {
						if(choice === "Confirm"){
							//delete their .LCK file
							deleteLockFile(currentFilePath);
							//finish checkout
							finishCheckOut(context, currentFilePath);
						}
					}
				);
			}
		});
	}else if(currentFileStatus === "locked"){
		//file is locked
		finishCheckOut(context, currentFilePath);
	}else if(currentFileStatus === "unlocked"){
		//file is unlocked
		finishCheckOut(context, currentFilePath);
	}
}

/**
 * successfully check out file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function finishCheckOut(context: vscode.ExtensionContext, path: string){

	//create local .LCK file 
	createLockFile(path);

	//need to push the .LCK file (maybe not)

	//set status and owner
	setFileStatus(context, path, "out");
	username().then(name => {
		setFileOwner(context, path, name.toLowerCase());
	});

	vscode.window.showWarningMessage("Pull file from remote server?", 
		...["Yes", "No"]).then(choice => {
			if(choice === "Yes"){
				//pull current file
				pullCurrentFile();
			}
		}
	);
	
	//remove readonly from local
	removeReadOnly(path);

	vscode.window.showInformationMessage("File checked out.");
	return null;
}

/**
 * save the file (not used)
 */
export function nativeSaveFile(){
	//save the file
	vscode.window.showInformationMessage("(save file)");
}