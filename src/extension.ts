// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as username from 'username';
import { callbackify } from 'util';

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
		onStart(context);
	}
	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	
	let checkInFile = vscode.commands.registerCommand('extension.checkInFile', () => {
		// check in file
		vscode.window.showInformationMessage("Checking in...");
		// if checked out by you, finish checkin
		// if checked out by someone else, prompt warning confirm/cancel
		//   - on confirm: finish checkin
		// if locked, do nothing
		// if unlocked, finish checkin

		if(vscode.window.activeTextEditor){
			let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
			//vscode.window.showInformationMessage(currentFilePath);
			let currentFileStatus = getFileStatus(context, currentFilePath);

			if(currentFileStatus === "out") {
				let currentFileOwner = getFileOwner(context, currentFilePath);
				getUserName().then(name => {
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
		} else {
			vscode.window.showInformationMessage("No open file.");
		}

	});

	let checkOutFile = vscode.commands.registerCommand('extension.checkOutFile', () => {
		// check out file
		vscode.window.showInformationMessage("Checking out...");
		// if checked out by you, do nothing
		// if checked out by someone else, prompt warning confirm/cancel
		//   - on confirm: finish checkout
		// if locked, remove readonly, finish Checkout
		// if unlocked, finishCheckout

		if(vscode.window.activeTextEditor){
			let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
			//vscode.window.showInformationMessage(currentFilePath);
			let currentFileStatus = getFileStatus(context, currentFilePath);

			if(currentFileStatus === "out") {
				let currentFileOwner = getFileOwner(context, currentFilePath);
				getUserName().then(name => {
					if(currentFileOwner === name.toLowerCase()){
						// file is checked out by you.
						vscode.window.showInformationMessage("File is already checked out by you.");
					}else{
						// file is checked out by someone else
						vscode.window.showWarningMessage("File is checked out by " + currentFileOwner + ". Override his/her checkout?", ...["Confirm", "Cancel"]).then(choice => {
							if(choice === "Confirm"){
								//delete their .LCK file
								deleteLockFile(currentFilePath);
								//finish checkout
								finishCheckOut(context, currentFilePath);
							}
						});
					}
				});
			}else if(currentFileStatus === "locked"){
				//file is locked
				finishCheckOut(context, currentFilePath);
			}else if(currentFileStatus === "unlocked"){
				//file is unlocked
				finishCheckOut(context, currentFilePath);
			}
		} else {
			vscode.window.showErrorMessage("No open file.");
		}
	});

	let dwPushFile = vscode.commands.registerCommand('extension.dwPushFile', () => {
		// called on push file

		// if locked OR checked out by someone else: disallow; warn user they should check the file out.
		// else: allow
		if(vscode.window.activeTextEditor){
			let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
			//vscode.window.showInformationMessage(currentFilePath);
			let currentFileStatus = getFileStatus(context, currentFilePath);

			if(currentFileStatus === "out") {
				let currentFileOwner = getFileOwner(context, currentFilePath);
				getUserName().then(name => {
					if(currentFileOwner === name.toLowerCase()){
						// file is checked out by you.
						// nativeSaveFile();
						vscode.window.showInformationMessage("(save file.)");
					}else{
						// file is checked out by someone else
						vscode.window.showErrorMessage("File is checked out by " + currentFileOwner + ". Please check file out to push.");
					}
				});
			}else if(currentFileStatus === "locked"){
				// file is locked
				vscode.window.showErrorMessage("File is locked. Please check file out to push.");
			}else if(currentFileStatus === "unlocked"){
				// file is unlocked
				pushCurrentFile();
			}
		} else {
			vscode.window.showErrorMessage("No open file.");
		}

	});

	let dwPullFile = vscode.commands.registerCommand('extension.dwPullFile', () => {
		// called on pull file

		// always allow
		pullCurrentFile();
	});

	let dwSaveFile = vscode.commands.registerCommand('extension.dwSaveFile', () => {
		// called on save file:
		// if locked OR checked out by someone else: disallow; warn user they should check the file out.
		// else: allow
		if(vscode.window.activeTextEditor){
			let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
			//vscode.window.showInformationMessage(currentFilePath);
			let currentFileStatus = getFileStatus(context, currentFilePath);

			if(currentFileStatus === "out") {
				let currentFileOwner = getFileOwner(context, currentFilePath);
				getUserName().then(name => {
					if(currentFileOwner === name.toLowerCase()){
						// file is checked out by you.
						// nativeSaveFile();
						vscode.window.showInformationMessage("(save file.)");
					}else{
						// file is checked out by someone else
						vscode.window.showErrorMessage("File is checked out by " + currentFileOwner + ". Please check file out to save.");
					}
				});
			}else if(currentFileStatus === "locked"){
				// file is locked
				vscode.window.showErrorMessage("File is locked. Please check file out to save.");
			}else if(currentFileStatus === "unlocked"){
				// file is unlocked
				// nativeSaveFile();
				vscode.window.showInformationMessage("(save file.)");
			}
		} else {
			vscode.window.showErrorMessage("No open file.");
		}
	});

	context.subscriptions.push(checkInFile, checkOutFile, dwPushFile, dwPullFile, dwSaveFile);
	
}

function onStart(context: vscode.ExtensionContext) {
	// called on open workspace

	// check all files for local .LCK files, and read-only status. for each file:
	// if .LCK file: mark as checked out by that person.
	// else: 
	//   if readonly: mark as locked.
	//   else: mark as unlocked.

	vscode.workspace.findFiles("**/*", "**/{node_modules,tns_modules,platforms}/**")
		.then((uris) => {
			uris.forEach((uri) => {
				if(isReadOnly(uri.fsPath)){
					context.workspaceState.update("status:" + uri.fsPath, "locked");
					console.log(uri.fsPath + " is locked.");
				} else {
					context.workspaceState.update("status:" + uri.fsPath, "unlocked");
					//console.log(uri.fsPath + " is unlocked.");
				}
			});
			vscode.workspace.findFiles("**/*.LCK", "**/{node_modules,tns_modules,platforms}/**")
			.then((uris) => {
				if(uris.length > 0) {
					uris.forEach((uri) => {
						let file = vscode.workspace.openTextDocument(uri);
						file.then((file) =>{
							let ownerName = file.getText().split("||")[0];
							let filePath = uri.fsPath.split(".LCK")[0];
							//console.log(filePath);
							if(ownerName.length > 0){
								console.log(ownerName + " owns file " + filePath);
								context.workspaceState.update("status:" + filePath, "out");
								context.workspaceState.update("owner:" + filePath, ownerName);
							}else{
								console.log("no owner for file " + filePath);
								context.workspaceState.update("owner:" + filePath, ownerName);
							}
						});
					});
					console.log("Status of all files checked.");
				}
			});
		});


	// CSS to display some markup before row in explorer file tree:
	// .monaco-list-row .monaco-tl-row::before {
		// content: '\f03f'; <-- checkmark, lock, etc.
		// color: 'red'; <-- red, green, black
		// position: absolute;
		// font: normal normal normal 16px/1 octicons;
	// }
}

function getUserName(){
	return username();
}

function getFileStatus(context: vscode.ExtensionContext, path: string){
	return context.workspaceState.get("status:" + path);
}

function getFileOwner(context: vscode.ExtensionContext, path: string){
	return context.workspaceState.get("owner:" + path);
}

function setFileStatus(context: vscode.ExtensionContext, path: string, status: string){
	context.workspaceState.update("status:" + path, status);
}

function setFileOwner(context: vscode.ExtensionContext, path: string, owner: string){
	context.workspaceState.update("owner:" + path, owner);
}

function isReadOnly(path: string){
	return ((fs.statSync(path).mode & 146) === 0);
}

//doesn't work
// function setReadOnly(path:string){
// 	function transform(path: fs.PathLike, cb: (arg0: null, arg1: fs.PathLike) => void){
// 	  if((fs.statSync(path).mode & 146) !== 0){
// 		//fs.statSync(path).mode = fs.statSync(path).mode & 146;
// 		fs.chmodSync(path, fs.statSync(path).mode & 146);
// 	  }
// 	  cb(null, path);
// 	}
// 	return require('event-stream').map(transform);
// }

function setReadOnly(path:string){
	if(!isReadOnly(path)){
		fs.chmodSync(path, fs.statSync(path).mode & 292);
	}
}

//doesn't work
// function removeReadOnly(path:string){
// 	function transform(path: fs.PathLike, cb: (arg0: null, arg1: fs.PathLike) => void){
// 	  if((fs.statSync(path).mode & 146) === 0){
// 		//fs.statSync(path).mode = fs.statSync(path).mode | 146;
// 		fs.chmodSync(path, fs.statSync(path).mode | 146);
// 	  }
// 	  cb(null, path);
// 	}
// 	return require('event-stream').map(transform);
// }

function removeReadOnly(path:string){
	if(isReadOnly(path)){
		fs.chmodSync(path, fs.statSync(path).mode | 146);
	}
}

function pullCurrentFile(){
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

function pushCurrentFile(){
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

function createLockFile(path: string){
	let lockFilePath = path + ".LCK";
	getUserName().then(name => {
		fs.writeFile(lockFilePath, name.toLowerCase() + "||" + name.toLowerCase() + "@marian.org", function (err) {
			if (err) { throw err; }
			//console.log('.LCK file saved!');
		});
	});
}

function deleteLockFile(path: string){
	let lockFilePath = path + ".LCK";
	fs.unlink(lockFilePath, function (err) {
		if (err) { throw err; }
		//console.log('.LCK file deleted!');
	});
}

/////////////////////////////////////////////////////////////////////////////////

function finishCheckIn(context: vscode.ExtensionContext, path: string){
	// remove local+remote  .LCK
	// add readonly to local
	// mark as locked
	// push to remote

	//remove local .LCK file 
	deleteLockFile(path);

	//need to remove remote .LCK file (maybe not)

	//remove readonly from local
	setReadOnly(path);

	//set file status
	setFileStatus(context, path, "locked");
	setFileOwner(context, path, "");

	//push to remove
	pushCurrentFile();
	
	vscode.window.showInformationMessage("File checked in.");
	return null;
}

function finishCheckOut(context: vscode.ExtensionContext, path: string){

	// add local+remote .LCK file
	// remove readonly from local
	// mark file as checked out
	// pull from remote

	//create local .LCK file 
	createLockFile(path);

	//need to push the .LCK file (maybe not)

	//remove readonly from local
	removeReadOnly(path);

	//set status and owner
	setFileStatus(context, path, "out");
	getUserName().then(name => {
		setFileOwner(context, path, name.toLowerCase());
	});

	//pull current file
	pullCurrentFile();

	vscode.window.showInformationMessage("File checked out.");
	return null;
}

function nativeSaveFile(){
	//save the file
}

// this method is called when your extension is deactivated
export function deactivate() {}
