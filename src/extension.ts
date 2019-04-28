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

	
		// ################################################################################################################################
		// ################################################################################################################################
		// ################################################################################################################################
		// ################################################################################################################################
		

		// The command has been defined in the package.json file
		// Now provide the implementation of the command with registerCommand
		// The commandId parameter must match the command field in package.json
		
		let checkInCurrentFile = vscode.commands.registerCommand('extension.checkInCurrentFile', () => {
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

				checkInFile(context, currentFilePath);

			} else {
				vscode.window.showInformationMessage("No open file.");
			}

		});

		let checkOutCurrentFile = vscode.commands.registerCommand('extension.checkOutCurrentFile', () => {
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

				checkOutFile(context, currentFilePath);

			} else {
				vscode.window.showErrorMessage("No open file.");
			}
		});

		let dwPushCurrentFile = vscode.commands.registerCommand('extension.dwPushCurrentFile', () => {
			// called on push file

			// if locked OR checked out by someone else: disallow; warn user they should check the file out.
			// else: allow
			if(vscode.window.activeTextEditor){
				let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
				//vscode.window.showInformationMessage(currentFilePath);
				let currentFileStatus = getFileStatus(context, currentFilePath);

				if(currentFileStatus === "out") {
					let currentFileOwner = getFileOwner(context, currentFilePath);
					username().then(name => {
						if(currentFileOwner === name.toLowerCase()){
							// file is checked out by you.
							pushCurrentFile();
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

		let dwPullCurrentFile = vscode.commands.registerCommand('extension.dwPullCurrentFile', () => {
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
					username().then(name => {
						if(currentFileOwner === name.toLowerCase()){
							// file is checked out by you.
							nativeSaveFile();
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
					nativeSaveFile();
				}
			} else {
				vscode.window.showErrorMessage("No open file.");
			}
		});

		context.subscriptions.push(checkInCurrentFile, checkOutCurrentFile, dwPushCurrentFile, dwPullCurrentFile, dwSaveFile);

		// ################################################################################################################################
		// ################################################################################################################################
		// ################################################################################################################################
		// ################################################################################################################################
	
	}

}


//check all files for local .LCK files, and read-only status
function onStart(context: vscode.ExtensionContext){
	vscode.workspace.findFiles("**/*", "**/{node_modules,tns_modules,platforms,.vscode}/**")
	.then((uris) => {
		if(uris.length > 0) {
			uris.forEach((uri) => {
				updateFileStatusByURI(context, uri);
			});
		}
	});
}

//updates the status of a single file by URI
function updateFileStatusByURI(context: vscode.ExtensionContext, uri: vscode.Uri){
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

//updates the status of a single file by fsPath
function updateFileStatusByPath(context: vscode.ExtensionContext, path: string){
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

//gets the status of a single file by fsPath
function getFileStatusByPath(path: string): string {
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

//gets the owner of a single file by fsPath
function getFileOwnerByPath(path: string): string{
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

function getFileStatus(context: vscode.ExtensionContext, path: string){
	//updateFileStatusByPath(context, path);
	return context.workspaceState.get("status:" + path);
	//return getFileStatusByPath(path);
}

function getFileOwner(context: vscode.ExtensionContext, path: string){
	//updateFileStatusByPath(context, path);
	return context.workspaceState.get("owner:" + path);
	//return getFileOwnerByPath(path);
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

function setReadOnly(path:string){
	if(!isReadOnly(path)){
		fs.chmodSync(path, fs.statSync(path).mode & 292);
	}
}

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
	username().then(name => {
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

function checkInFile(context: vscode.ExtensionContext, currentFilePath: string){
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

function finishCheckIn(context: vscode.ExtensionContext, path: string){
	// remove local+remote  .LCK
	// mark as locked
	// push to remote
	// add readonly to local

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

function checkOutFile(context: vscode.ExtensionContext, currentFilePath: string) {
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

function finishCheckOut(context: vscode.ExtensionContext, path: string){

	// add local+remote .LCK file
	// remove readonly from local
	// mark file as checked out
	// pull from remote

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

function nativeSaveFile(){
	//save the file
	vscode.window.showInformationMessage("(save file)");
}


// this method is called when your extension is deactivated
export function deactivate() {}
