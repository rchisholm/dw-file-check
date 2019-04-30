/**
 * contains the functions used in the commands for dw-file-check
 */
import * as vscode from 'vscode';
import * as username from 'username';
import * as status from './dw-status';
import * as utils from './dw-utils';

/**
 * called on activation. updates status of all workspace files
 * @param context vscode extension context
 */
export function onStart(context: vscode.ExtensionContext) {
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
            //vscode.window.showInformationMessage(currentFilePath);
            let currentFileStatus = status.getFileStatus(context, currentFilePath);

            if(currentFileStatus === "out") {
                let currentFileOwner = status.getFileOwner(context, currentFilePath);
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
 * @param currentFilePath fs path of the file
 */
export function checkInFile(context: vscode.ExtensionContext, currentFilePath: string){
	let currentFileStatus = status.getFileStatus(context, currentFilePath);
	
	if(currentFileStatus === "out") {
		let currentFileOwner = status.getFileOwner(context, currentFilePath);
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
	utils.deleteLockFile(path);

	//need to remove remote .LCK file (maybe not)

	//set file status
	status.setFileStatus(context, path, "locked");
	status.setFileOwner(context, path, "");

	//push to remote
	pushCurrentFile();

	//set readonly on local
	utils.setReadOnly(path);
	
	vscode.window.showInformationMessage("File checked in.");
	return null;
}

/**
 * try to check out file
 * @param context vscode extension context
 * @param currentFilePath fs path of the file
 */
export function checkOutFile(context: vscode.ExtensionContext, currentFilePath: string) {
	let currentFileStatus = status.getFileStatus(context, currentFilePath);

	if(currentFileStatus === "out") {
		let currentFileOwner = status.getFileOwner(context, currentFilePath);
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
							utils.deleteLockFile(currentFilePath);
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
	utils.createLockFile(path);

	//need to push the .LCK file (maybe not)

	//set status and owner
	status.setFileStatus(context, path, "out");
	username().then(name => {
		status.setFileOwner(context, path, name.toLowerCase());
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
	utils.removeReadOnly(path);

	vscode.window.showInformationMessage("File checked out.");
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

        if(currentFileStatus === "out") {
            let currentFileOwner = status.getFileOwner(context, currentFilePath);
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
}

/**
 * save the file (not used)
 */
export function nativeSaveFile(){
	//save the file
	vscode.window.showInformationMessage("(save file)");
}