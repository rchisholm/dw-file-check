/**
 * contains fileSystem (fs) utilities
 */
import * as fs from 'fs';
import * as username from 'username';

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