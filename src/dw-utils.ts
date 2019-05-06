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
export function createLockFile(path: string, context: vscode.ExtensionContext){
	let lockFilePath = path + ".LCK";
	fs.writeFile(lockFilePath, getUserName(context) + "||" + getEmail(context), function (err) {
		if (err) { throw err; }
		//console.log('.LCK file saved!');
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
 * returns true file is excluded in settings
 * @param path fs path of the file
 */
export function isExcludedFile(path: string): boolean {
	return path.endsWith(".LCK") 
		|| path.endsWith("dwsync.xml") 
		|| path.endsWith("_notes")
		|| path.endsWith(".git");

	// let excludeSettings = vscode.workspace.getConfiguration().get("files.exclude");
	// if(excludeSettings) {
	// 	console.error(excludeSettings);
	// }

	// let excludePatterns: string[] = [];
	// excludePatterns.push(".LCK");
	// excludePatterns.push("dwsync.xml");
	// excludePatterns.push("_notes");

	// TODO: need to add all files.exclude patterns here, and not just use "endsWith" but match the pattern
}

/**
 * get name of a file from the path
 * @param path fs path of the file
 */
export function getFileName(path: string) {
	let pathParts = path.split(getSlash());
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
			if(fs.existsSync(folder.uri.fsPath + cPath("/.vscode/settings.json"))) {
				let settingsPath = folder.uri.fsPath + cPath("/.vscode/settings.json");
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
	//console.log("running createDeploymentConfig()...");
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
			//console.error("folder: " + folder.uri.fsPath);
			if(!fs.existsSync(folder.uri.fsPath + cPath("/.vscode"))){
				//.vscode does not exist; create it
				
				fs.mkdirSync(folder.uri.fsPath + cPath("/.vscode"));
			}

			if(!fs.existsSync(folder.uri.fsPath + cPath("/.vscode/settings.json"))) {
				//settings.json does not exist; create it
				fs.writeFileSync(folder.uri.fsPath + cPath("/.vscode/settings.json"), "{}"); 
			}
			
			let settingsPath = folder.uri.fsPath + cPath("/.vscode/settings.json");
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

/**
 * returns slash for unix, backslash for windows
 */
export function getSlash(): string {
	const isWin = process.platform === "win32";
	return isWin ? "\\" : "/";
}

/**
 * cleans a path so it is cross-platform
 * @param input the path to clean
 */
export function cPath(input: string) : string {
	return input.replace("/", getSlash());
}

/**
 * sets the username in workspace state to the value from settings.json.
 * If no value is set, use a username value from OS login info.
 * @param context vscode extension context
 */
export function setUsername(context: vscode.ExtensionContext) {
	let settingsUsername = vscode.workspace.getConfiguration().get('dw.username') as string;
	if(settingsUsername.length > 0 && settingsUsername !== 'undefined') {
		context.workspaceState.update("username", settingsUsername);
	} else {
		username().then(name => {
			context.workspaceState.update("username", name.toLowerCase());
			vscode.workspace.getConfiguration().update("username", name.toLowerCase());
		});
	}
}

/**
 * get username from workspace state
 * @param context vscode extension context
 */
export function getUserName(context: vscode.ExtensionContext): string {
	return context.workspaceState.get("username") as string;
}

/**
 * sets the email in workspace state to the value from settings.json.
 * If no value is set, use a username value from OS login info.
 * @param context vscode extension context
 */
export function setEmail(context: vscode.ExtensionContext) {
	let settingsEmail = vscode.workspace.getConfiguration().get('dw.email') as string;
	if(settingsEmail.length > 0 && settingsEmail !== 'undefined') {
		context.workspaceState.update("email", settingsEmail);
	} else {
		username().then(name => {
			context.workspaceState.update("email", name.toLowerCase());
			vscode.workspace.getConfiguration().update("email", name.toLowerCase());
		});
	}
}

/**
 * get email from workspace state
 * @param context vscode extension context
 */
export function getEmail(context: vscode.ExtensionContext): string {
	return context.workspaceState.get("email") as string;
}

/**
 * set files.exclude property in local 
 */
export function setFilesExclude() {
	if(vscode.workspace.workspaceFolders){
		vscode.workspace.workspaceFolders.forEach(folder => {
			//console.error(folder.uri.fsPath);
			//console.error("folder: " + folder.uri.fsPath);
			if(!fs.existsSync(folder.uri.fsPath + cPath("/.vscode"))){
				//.vscode does not exist; create it
				
				fs.mkdirSync(folder.uri.fsPath + cPath("/.vscode"));
			}

			if(!fs.existsSync(folder.uri.fsPath + cPath("/.vscode/settings.json"))) {
				//settings.json does not exist; create it
				fs.writeFileSync(folder.uri.fsPath + cPath("/.vscode/settings.json"), "{}"); 
			}

			let settingsPath = folder.uri.fsPath + cPath("/.vscode/settings.json");
			let settingsData = JSON.parse(stripJsonComments(fs.readFileSync(settingsPath, "utf8")));
			//let excludeSettings = { "**/*.LCK": true, "**/dwsync.xml": true };
			//settingsData['files.exclude'] = excludeSettings;
			if(!settingsData['files.exclude']) {
				settingsData['files.exclude'] = {};
			}
			settingsData['files.exclude']["**/*.LCK"] = true;
			settingsData['files.exclude']["**/dwsync.xml"] = true;
			settingsData['files.exclude']["**/_notes"] = true;
			// may need to add other files

			fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 4));
		});
	}
}