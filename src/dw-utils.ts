/**
 * contains fileSystem (fs) utilities
 */
import * as fs from 'fs';
import * as username from 'username';
import * as vscode from 'vscode';
import stripJsonComments = require('strip-json-comments');

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
 * returns true if the file is a folder
 * @param path fs path of the file
 */
export function isFolder(path: string) {
	return fs.lstatSync(path).isDirectory();
}

/**
 * get name of a file from the path
 * @param path fs path of the file
 */
export function getFileName(path: string) {
	let pathParts = path.split('\\');
	return pathParts[pathParts.length-1];
}

/**
 * returns true if a deploy.reloaded config option exists
 */
export function deployConfigExists(): boolean {
	// if there is a folder .vscode
	//  if it contains a file settings.json
	//   if it contains a "deploy.reloaded" attribute
	//    return true;
	
	//console.log(vscode.workspace.workspaceFolders);
	if(vscode.workspace.workspaceFolders){
		vscode.workspace.workspaceFolders.forEach(folder => {
			//console.error(folder.uri.fsPath);
			//console.error("folder: " + folder.uri.fsPath);
			if(fs.existsSync(folder.uri.fsPath + "\\.vscode\\settings.json")) {
				let settingsPath = folder.uri.fsPath + "\\.vscode\\settings.json";
				let settingsData = JSON.parse(stripJsonComments(fs.readFileSync(settingsPath, "utf8")));
				//console.log("settings data:");
				//console.log(settingsData);
				if(settingsData['deploy.reloaded']){
					return true;
				} 
			}
		});
	}
	return false;
}

/**
 * prompt user for options to set deploy.reloaded config
 */
export function createDeployConfig() {
	console.log("running createDeploymentConfig()...");
	let targetType: string;
	let targetName: string = "server";
	let targetDescription: string = "live server";
	let targetHost: string;
	let targetPort: number;
	let targetUser: string;
	let targetPassword: string;
	let targetDir: string;

	//console.log(vscode.workspace.workspaceFolders);
	if(vscode.workspace.workspaceFolders){
		vscode.workspace.workspaceFolders.forEach(folder => {
			//console.error(folder.uri.fsPath);
			console.error("folder: " + folder.uri.fsPath);
			if(!fs.existsSync(folder.uri.fsPath + "\\.vscode")){
				//.vscode does not exist; create it
				
				fs.mkdirSync(folder.uri.fsPath + "\\.vscode");
			}

			if(!fs.existsSync(folder.uri.fsPath + "\\.vscode\\settings.json")) {
				//settings.json does not exist; create it
				fs.writeFileSync(folder.uri.fsPath + "\\.vscode\\settings.json", "{}"); 
			}
			
			let settingsPath = folder.uri.fsPath + "\\.vscode\\settings.json";
			let settingsData = JSON.parse(stripJsonComments(fs.readFileSync(settingsPath, "utf8")));
			if(!settingsData['deploy.reloaded']){
				//no deploy reloaded data ; add some
				let deployReloadedData: any;

				//start prompting for info
				vscode.window.showWarningMessage("No server data is present for " + folder.uri.fsPath + ". Enter server details?", ...["Yes", "No"]).then(choice => {
					if(choice === "Yes"){
						vscode.window.showQuickPick(['FTP', 'SFTP'], { placeHolder: "Select Transfer Protocol", ignoreFocusOut: true }).then(protocol => {
							targetType = protocol ? protocol.toLowerCase() : "protocol"; 
							vscode.window.showInputBox({ prompt: 'Host (IP / URL):', ignoreFocusOut: true  }).then(host => {
								targetHost = host ? host : "host";
								vscode.window.showInputBox({ prompt: 'Port:', placeHolder: '22', ignoreFocusOut: true  }).then(port => {
									targetPort = port ? +port : 22;
									vscode.window.showInputBox({ prompt: 'User:', ignoreFocusOut: true  }).then(user => {
										targetUser = user ? user : "user";
										vscode.window.showInputBox({ prompt: 'Password:', password: true, ignoreFocusOut: true  }).then(pass => {
											targetPassword = pass ? pass : "password";
											vscode.window.showInputBox({ prompt: 'Dir:', placeHolder: '/home/user/public_html/dir', ignoreFocusOut: true  }).then(dir => {
												targetDir = dir ? dir : "directory";
												deployReloadedData = {
													"packages": [
														{
															"name": "All",
															"description": "All files in workspace",
															"exclude": [
																"*.code-workspace",
																"**/_notes",
																"*.LCK",
																"**/.vscode/**",
																"**/.git/**",
																".gitignore",
																"**/.DS_Store"
															]
														}
													],
													"targets": [
														{
															"type": targetType, 
															"name": targetName,
															"description": targetDescription,
															"host": targetHost, 
															"port": targetPort,
															"user": targetUser, 
															"password": targetPassword,
															"dir": targetDir
														}
													]
												};
												// We now have the deploy reloaded data to insert. 
												// Append it to the current settings.json data, and write it to file.
												settingsData['deploy.reloaded'] = deployReloadedData;
												fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 4));
												vscode.window.showInformationMessage("Server data set.");
											});
										});
									});
								});
							});
						});
					}
				});
			} 
		});
	}
}