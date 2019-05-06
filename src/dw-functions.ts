/**
 * contains the functions used in the commands for dw-file-check
 */
import * as vscode from 'vscode';
import * as username from 'username';
import * as status from './dw-status';
import * as utils from './dw-utils';

/**
 * called on activation.
 * @param context vscode extension context
 */
export function onStart(context: vscode.ExtensionContext) {

	// if there is no deploy config, create one
	if(!utils.deployConfigExists()) {
		utils.createDeployConfig();
	}
	
	// set username/email in workspaceState
	utils.setUsername(context);
	utils.setEmail(context);

	// exclude DW meta files
	utils.setFilesExclude();

	// updates status of all workspace files
	status.updateWorkspaceStatus(context);

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
 * try to push currently open file
 * @param context vscode extension context
 */
export function startPushCurrentFile(context: vscode.ExtensionContext) {
        // if locked OR checked out by someone else: disallow; warn user they should check the file out.
        // else: allow
        if(vscode.window.activeTextEditor){
            let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
            let fileName = utils.getFileName(currentFilePath);
            //vscode.window.showInformationMessage(currentFilePath);
            let currentFileStatus = status.getFileStatus(context, currentFilePath);

            if(currentFileStatus === "out") {
                let currentFileOwner = status.getFileOwner(context, currentFilePath);
				if(currentFileOwner === utils.getUserName(context)){
					// file is checked out by you.
					pushCurrentFile();
				}else{
					// file is checked out by someone else
					vscode.window.showErrorMessage(fileName + " is checked out by " + currentFileOwner + ". Please check file out to push.");
				}
            }else if(currentFileStatus === "locked"){
                // file is locked
                vscode.window.showErrorMessage(fileName + " is locked. Please check file out to push.");
            }else{
                // file is unlocked
                pushCurrentFile();
            }
        } else {
            vscode.window.showErrorMessage("No open file.");
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
 * try to check in file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function checkInFile(context: vscode.ExtensionContext, path: string){
	let currentFileStatus = status.getFileStatus(context, path);
	let fileName = utils.getFileName(path);
	
	if(currentFileStatus === "out") {
		let currentFileOwner = status.getFileOwner(context, path);
		if(currentFileOwner === utils.getUserName(context)){
			// file is checked out by you.
			// vscode.window.showInformationMessage("File is checked out by you!");
			finishCheckIn(context, path);
		}else{
			// file is checked out by someone else
			vscode.window.showWarningMessage(fileName + " is checked out by " + currentFileOwner + ". Override his/her checkout?", ...["Confirm", "Cancel"])
				.then(choice => {
					if(choice === "Confirm"){
						finishCheckIn(context, path);
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
		finishCheckIn(context, path);
	}
}

/**
 * successfully check in file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function finishCheckIn(context: vscode.ExtensionContext, path: string){

	let fileName = utils.getFileName(path);

	//remove local .LCK file 
	utils.deleteLockFile(path);

	//need to remove remote .LCK file (maybe not)

	//set file status
	status.setFileStatus(context, path, "locked");
	status.setFileOwner(context, path, "");

	//push to remote
	pushCurrentFile();

	//set readonly on local
	utils.setReadOnly(path);
	
	vscode.window.showInformationMessage(fileName + " checked in.");
	return null;
}

/**
 * try to check out file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function checkOutFile(context: vscode.ExtensionContext, path: string) {
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
						finishCheckOut(context, path);
					}
				}
			);
		}
	}else{
		//file is locked or unlocked
		finishCheckOut(context, path);
	}
}

/**
 * successfully check out file
 * @param context vscode extension context
 * @param path fs path of the file
 */
export function finishCheckOut(context: vscode.ExtensionContext, path: string){

	let fileName = utils.getFileName(path);

	//create local .LCK file 
	utils.createLockFile(path, context);

	//need to push the .LCK file (maybe not)

	//set status and owner
	status.setFileStatus(context, path, "out");
	status.setFileOwner(context, path, utils.getUserName(context));

	vscode.window.showWarningMessage("Pull " + fileName + " from remote server?", 
		...["Yes", "No"]).then(choice => {
			if(choice === "Yes"){
				//pull current file
				pullCurrentFile();
			}
		}
	);
	
	//remove readonly from local
	utils.removeReadOnly(path);

	vscode.window.showInformationMessage(fileName + " checked out.");
	return null;
}

/**
 * try to save current file (not used)
 * @param context vscode extension context
 */
export function startSaveFile(context: vscode.ExtensionContext) {
    // if locked OR checked out by someone else: disallow; warn user they should check the file out.
    // else: allow
    if(vscode.window.activeTextEditor){
        let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
        //vscode.window.showInformationMessage(currentFilePath);
		let currentFileStatus = status.getFileStatus(context, currentFilePath);
		let fileName = utils.getFileName(currentFilePath);

        if(currentFileStatus === "out") {
		let currentFileOwner = status.getFileOwner(context, currentFilePath);
			if(currentFileOwner === utils.getUserName(context)){
				// file is checked out by you.
				nativeSaveFile();
			}else{
				// file is checked out by someone else
				vscode.window.showErrorMessage(fileName + " is checked out by " + currentFileOwner + ". Please check file out to save.");
			}
        }else if(currentFileStatus === "locked"){
            // file is locked
            vscode.window.showErrorMessage(fileName + " is locked. Please check file out to save.");
        }else{
            // file is unlocked
            nativeSaveFile();
        }
    } else {
        vscode.window.showErrorMessage("No open file.");
    }
}

/**
 * save the file (not used)
 */
export function nativeSaveFile(){
	//save the file
	vscode.window.showInformationMessage("(save file)");
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
	}
}

/**
 * displays a list of commands available for the right-clicked file
 * @param context vscode extension context
 * @param fileOrFolder uri of the right-clicked file
 */
export function openFileOptions(context: vscode.ExtensionContext, fileOrFolder: vscode.Uri){
	//vscode.window.showInformationMessage('File: ' + fileOrFolder.fsPath);
	if (utils.isFolder(fileOrFolder.fsPath)) {
		vscode.window.showWarningMessage("Directories have no status. Please select an individual file.");
	} else {
		//open the clicked file, then show quickpick list
		vscode.workspace.openTextDocument(fileOrFolder)
		.then((doc:vscode.TextDocument) => {
			vscode.window.showTextDocument(doc)
			.then(() => {
				const QUICK_PICKS = [
					'$(arrow-down) Pull File',
					'$(arrow-up) Push File',
					'$(check) Check Out',
					'$(lock) Check In'
				];

				//vscode.window.showQuickPick(QUICK_PICKS);
				vscode.window.showQuickPick(QUICK_PICKS).then((choice) => {
					switch(choice){
						case '$(arrow-down) Pull File':
						vscode.commands.executeCommand('extension.dwPullCurrentFile');
						break;
						case '$(arrow-up) Push File':
						vscode.commands.executeCommand('extension.dwPushCurrentFile');
						break;
						case '$(check) Check Out':
						vscode.commands.executeCommand('extension.dwCheckOutCurrentFile');
						break;
						case '$(lock) Check In':
						vscode.commands.executeCommand('extension.dwCheckInCurrentFile');
						break;
					}
				});
			});
		});
	}
}