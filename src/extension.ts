// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as username from 'username';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// This code will only be executed once when your extension is activated
	//console.log("DW file check activated.");

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

			/*
			getUserName().then(name => {
				vscode.window.showInformationMessage(name);
			});
			*/

			if(currentFileStatus === "out") {
				let currentFileOwner = getFileOwner(context, currentFilePath);
				getUserName().then(name => {
					if(currentFileOwner === name){
						// file is checked out by you.
						// vscode.window.showInformationMessage("file is checked out by you!");
						finishCheckIn(context, currentFilePath);
					}else{
						// file is checked out by someone else
						// vscode.window.showInformationMessage("file is checked out by " + currentFileOwner + "!");
						//prompt...
						vscode.window.showWarningMessage("file is checked out by " + currentFileOwner + ". Override his/her checkout?", ...["Confirm", "Cancel"]).then(choice => {
							if(choice === "Confirm"){
								finishCheckIn(context, currentFilePath);
							}
						});
					}
				});
			}else if(currentFileStatus === "locked"){
				//file is locked
				vscode.window.showInformationMessage("file is locked...");
				//do nothing
			}else if(currentFileStatus === "unlocked"){
				//file is unlocked
				vscode.window.showInformationMessage("file is unlocked.");
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

	});

	let onSaveFile = vscode.commands.registerCommand('extension.onSaveFile', () => {
		// called on save file

		// if locked OR checked out by someone else: disallow; warn user they should check the file out.
		// else: allow
	});

	let onOpenFile = vscode.commands.registerCommand('extension.onOpenFile', () => {
		// called on open file

		// always allow
	});

	let onPushFile = vscode.commands.registerCommand('extension.onPushFile', () => {
		// called on push file

		// if locked OR checked out by someone else: disallow; warn user they should check the file out.
		// else: allow
	});

	let onPullFile = vscode.commands.registerCommand('extension.onPullFile', () => {
		// called on pull file

		// always allow
	});
	context.subscriptions.push(checkInFile, checkOutFile, onSaveFile, onOpenFile, onPushFile, onPullFile);
	
}

function onStart(context: vscode.ExtensionContext) {
	// called on open workspace

	// check all files for local .LCK files, and read-only status. for each file:
	// if .LCK file: mark as checked out by that person.
	// else: 
	//   if readonly: mark as locked.
	//   else: mark as unlocked.

	let files = vscode.workspace.findFiles("**/*", "**/{node_modules,tns_modules,platforms}/**")
		.then((uris) => {
			uris.forEach((uri) => {
				if(isReadOnly(uri.path)){
					context.workspaceState.update("status:" + uri.path, "locked");
					//console.log(uri.path + " is locked.");
				} else {
					context.workspaceState.update("status:" + uri.path, "unlocked");
					//console.log(uri.path + " is unlocked.");
				}
			});
		});

	let lockFiles = vscode.workspace.findFiles("**/*.LCK", "**/{node_modules,tns_modules, platforms}/**")
		.then((uris) => {
			if(uris.length > 0) {
				uris.forEach((uri) => {
					let file = vscode.workspace.openTextDocument(uri);
					file.then((file) =>{
						let ownerName = file.getText().split("||")[0];
						let filePath = uri.path.split(".LCK")[0];
						console.log(filePath);
						if(ownerName.length > 0){
							console.log(ownerName);
							context.workspaceState.update("status:" + filePath, "out");
							context.workspaceState.update("owner:" + filePath, ownerName);
						}else{
							console.log("(no owner)");
							context.workspaceState.update("owner:" + filePath, ownerName);
						}
					});
				});
			}
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

function getUserEmail(){
	//try to get email from OS? If not, default case:
	return username() + "@marian.org";
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

//not sure if this works
function setReadOnly(path: string){
	if(!isReadOnly(path)){
		fs.statSync(path).mode = fs.statSync(path).mode & 146;
	}
}

//not sure if this works
function removeReadOnly(path: string){
	if(isReadOnly(path)){
		fs.statSync(path).mode = fs.statSync(path).mode | 146;
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
					vscode.commands.executeCommand("deploy.reloaded.pullFile");
				},
				function(){
					console.log( "Deploy activation failed");
				}
			);   
		} else {
			vscode.commands.executeCommand("deploy.reloaded.pullFile");
		}
	}
}

/////////////////////////////////////////////////////////////////////////////////

function finishCheckIn(context: vscode.ExtensionContext, path: string){
	// remove local+remote  .LCK
	// add readonly to local
	// mark as locked
	// push to remote
	
	vscode.window.showInformationMessage("File checked in.");
	return null;
}

function finishCheckOut(context: vscode.ExtensionContext, path: string){
	// add local+remote .LCK file
	// remove readonly from local
	// mark file as checked out
	// pull from remote

	let lockFilePath = path + ".LCK";
	fs.writeFile(lockFilePath, getUserName() + "||" + getUserEmail(), function (err) {
		if (err) { throw err; }
		console.log('Saved!');
	});

	//remove readonly from local
	removeReadOnly(path);

	//set status and owner
	setFileStatus(context, path, "out");
	getUserName().then(name => {
		setFileOwner(context, path, name);
	});

	//pull current file
	pullCurrentFile();

	vscode.window.showInformationMessage("File checked out.");
	return null;
}

// this method is called when your extension is deactivated
export function deactivate() {}
