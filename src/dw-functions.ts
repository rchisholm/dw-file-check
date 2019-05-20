/**
 * contains the core functionality for dw-file-check
 */
import * as vscode from 'vscode';
import * as status from './dw-status';
import * as utils from './dw-utils';
import * as ftp from './dw-ftp';

/**
 * called on activation.
 * @param context vscode extension context
 */
export function onStart(context: vscode.ExtensionContext) {

	//console.error("test 1");

	// if there is no deploy config, create one
	if(!utils.deployConfigExists()) {
		utils.createDeployConfig();
	}

	//console.error("test 2");

	if(!utils.userConfigExists()) {
		utils.createUserConfig();
	}

	//console.error("test 3");

	if(!utils.emailConfigExists()) {
		utils.createEmailConfig();
	}

	//console.error("test 4");

	
	// set username/email in workspaceState
	utils.setUsername(context);
	utils.setEmail(context);

	// exclude DW meta files
	utils.setFilesExclude();

	// updates status of all workspace files
	status.updateWorkspaceStatus(context);

}

/**
 * get file from server
 * @param path path of the file
 */
export function getFile(path: string) {
	ftp.getFile(path);
}

/**
 * 
 * @param context 
 * @param path 
 */
export function startPutFile(context: vscode.ExtensionContext, path: string) {
	// if locked OR checked out by someone else: disallow; warn user they should check the file out.
	// else: allow
	let fileName = utils.getFileName(path);
	//vscode.window.showInformationMessage(currentFilePath);
	let fileStatus = status.getFileStatus(context, path);

	if(fileStatus === "out") {
		let fileOwner = status.getFileOwner(context, path);
		if(fileOwner === utils.getUserName(context)){
			// file is checked out by you.
			finishPutFile(path);
		}else{
			// file is checked out by someone else
			vscode.window.showErrorMessage(fileName + " is checked out by " + fileOwner + ". Please check file out to push.");
		}
	}else if(fileStatus === "locked"){
		// file is locked
		vscode.window.showErrorMessage(fileName + " is locked. Please check file out to push.");
	}else{
		// file is unlocked
		finishPutFile(path);
	}
}

/**
 * push file to server
 * @param path path of the file
 */
function finishPutFile(path: string) {
	ftp.putFile(path);
}


/**
 * try to check in file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function startCheckInFile(context: vscode.ExtensionContext, path: string){
	let currentFileStatus = status.getFileStatus(context, path);
	let fileName = utils.getFileName(path);
	
	if(currentFileStatus === "out") {
		let currentFileOwner = status.getFileOwner(context, path);
		if(currentFileOwner === utils.getUserName(context)){
			// file is checked out by you.
			// vscode.window.showInformationMessage("File is checked out by you!");
			finishCheckInFile(context, path);
		}else{
			// file is checked out by someone else
			vscode.window.showWarningMessage(fileName + " is checked out by " + currentFileOwner + ". Override his/her checkout?", ...["Confirm", "Cancel"])
				.then(choice => {
					if(choice === "Confirm"){
						finishCheckInFile(context, path);
					}
				}
			);
		}
	}else if(currentFileStatus === "locked"){
		//file is locked
		vscode.window.showWarningMessage(fileName + " is locked. Already checked in.");
		//do nothing
	}else{
		//file is unlocked
		//vscode.window.showInformationMessage("File is unlocked.");
		finishCheckInFile(context, path);
	}
}


/**
 * successfully check in file
 * @param context vscode extension context
 * @param path fs path of the file
 */
function finishCheckInFile(context: vscode.ExtensionContext, path: string){

	let fileName = utils.getFileName(path);

	//remove local .LCK file 
	utils.deleteLockFile(path);

	//need to remove remote .LCK file (maybe not)

	//set file status
	status.setFileStatus(context, path, "locked");
	status.setFileOwner(context, path, "");

	//push to remote
	finishPutFile(path);

	//set readonly on local
	utils.setReadOnly(path);
	
	vscode.window.showInformationMessage(fileName + " checked in.");
	vscode.commands.executeCommand("extension.dwRefreshTree");
}

/**
 * try to check out file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function startCheckOutFile(context: vscode.ExtensionContext, path: string) {
	let currentFileStatus = status.getFileStatus(context, path);
	let fileName = utils.getFileName(path);

	if(currentFileStatus === "out") {
		let currentFileOwner = status.getFileOwner(context, path);
		if(currentFileOwner === utils.getUserName(context)){
			// file is checked out by you.
			vscode.window.showWarningMessage(fileName + " is already checked out by you.");
		}else{
			// file is checked out by someone else
			vscode.window.showWarningMessage(fileName + " is checked out by " + currentFileOwner + ". Override his/her checkout?", 
				...["Confirm", "Cancel"]).then(choice => {
					if(choice === "Confirm"){
						//delete their .LCK file
						utils.deleteLockFile(path);
						//finish checkout
						finishCheckOutFile(context, path);
					}
				}
			);
		}
	}else{
		//file is locked or unlocked
		finishCheckOutFile(context, path);
	}
}

/**
 * successfully check out file
 * @param context vscode extension context
 * @param path fs path of the file
 */
function finishCheckOutFile(context: vscode.ExtensionContext, path: string){

	let fileName = utils.getFileName(path);

	//create local .LCK file 
	utils.createLockFile(path, context);

	//need to push the .LCK file (maybe not)

	//set status and owner
	status.setFileStatus(context, path, "out");
	status.setFileOwner(context, path, utils.getUserName(context));

	vscode.window.showWarningMessage("Get " + fileName + " from remote server?", 
		...["Yes", "No"]).then(choice => {
			if(choice === "Yes"){
				//pull current file
				getFile(path);
			}
		}
	);
	
	//remove readonly from local
	utils.removeReadOnly(path);

	vscode.window.showInformationMessage(fileName + " checked out.");
	vscode.commands.executeCommand("extension.dwRefreshTree");
}


// export function treeCheckOutFile(context: )

// /**
//  * displays a list of commands available for the right-clicked file
//  * @param context vscode extension context
//  * @param fileOrFolder uri of the right-clicked file
//  */
// export function openFileOptions(context: vscode.ExtensionContext, fileOrFolder: vscode.Uri){
// 	//vscode.window.showInformationMessage('File: ' + fileOrFolder.fsPath);
// 	if (utils.isFolder(fileOrFolder.fsPath)) {
// 		vscode.window.showWarningMessage("Directories have no status. Please select an individual file.");
// 	} else {
// 		//open the clicked file, then show quickpick list
// 		vscode.workspace.openTextDocument(fileOrFolder)
// 		.then((doc:vscode.TextDocument) => {
// 			vscode.window.showTextDocument(doc)
// 			.then(() => {
// 				const QUICK_PICKS = [
// 					'$(arrow-down) Pull File',
// 					'$(arrow-up) Push File',
// 					'$(check) Check Out',
// 					'$(lock) Check In'
// 				];

// 				//vscode.window.showQuickPick(QUICK_PICKS);
// 				vscode.window.showQuickPick(QUICK_PICKS).then((choice) => {
// 					switch(choice){
// 						case '$(arrow-down) Pull File':
// 						vscode.commands.executeCommand('extension.dwPullCurrentFile');
// 						break;
// 						case '$(arrow-up) Push File':
// 						vscode.commands.executeCommand('extension.dwPushCurrentFile');
// 						break;
// 						case '$(check) Check Out':
// 						vscode.commands.executeCommand('extension.dwCheckOutCurrentFile');
// 						break;
// 						case '$(lock) Check In':
// 						vscode.commands.executeCommand('extension.dwCheckInCurrentFile');
// 						break;
// 					}
// 				});
// 			});
// 		},
// 		() => {
// 			vscode.window.showErrorMessage("DW File Operations not supported for non-text files.");
// 		});
// 	}
// }

/**
 * for testing SFTP/FTP put
 * @param path path of file
 */
export function testPutFile(path: string) {
	ftp.putFile(path);
}

/**
 * for testing SFTP/FTP get
 * @param path path of file
 */
export function testGetFile(path: string) {
	ftp.getFile(path);
}