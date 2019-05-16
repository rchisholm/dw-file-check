
import * as fs from 'fs';
import * as dwUtil from './dw-utils';
import * as vscode from 'vscode';
import * as ftp from 'ftp';
import * as sftp from 'ssh2-sftp-client';

/**
 * get the remote dir from settings.json
 */
function getRemoteDir(): string {
    let settings = vscode.workspace.getConfiguration().get('dw-file-check') as any;
	if(settings['server']['dir']) { 
        return settings['server']['dir']; 
    } else {
        console.error("no server.dir setting found!");
        return "";
    }
}

/**
 * gets the remote path of the file
 * @param filePath the local path of the file
 */
function getRemoteFilePath(filePath: string) {
    let workspacePath = vscode.workspace.rootPath;
    if(!workspacePath) {
        console.error("no workspace path...");
        return filePath;
    } else {
        let relPath = filePath.replace(workspacePath + dwUtil.getSlash(), "");
        let remotePath = dwUtil.serverPath(getRemoteDir() + relPath);
        // console.warn("filePath: " + filePath);
        // console.warn("workspacePath: " + workspacePath);
        // console.warn("relPath: " + relPath);
        // console.warn("remotePath: " + remotePath);
        return remotePath;
    }
}

/**
 * returns the server config option
 */
function getServerConfig(): any {
    let serverConfig: any = {};
    let settings = vscode.workspace.getConfiguration().get('dw-file-check') as any;
    if(settings['server']) {
        let serverSettings = settings['server'];
        if(serverSettings['user']) { 
            serverConfig['user'] = serverSettings['user']; 
            serverConfig['username'] = serverSettings['user']; 
        }
        if(serverSettings['password']) { 
            serverConfig['password'] = serverSettings['password']; 
        }
        if(serverSettings['host']) { 
            serverConfig['host'] = serverSettings['host']; 
        }
        if(serverSettings['port']) { 
            serverConfig['port'] = serverSettings['port']; 
        }
    } else {
        vscode.window.showErrorMessage("No server config available.");
    }
    return serverConfig;
}

/**
 * puts file with FTP or SFTP, depending on type in settings.json
 * @param filePath path of file to put
 */
export function putFile(filePath: string) {
    let settings = vscode.workspace.getConfiguration().get('dw-file-check') as any;
    if(settings['server']) {
        if(settings['server']['type']){
            if(settings['server']['type'].toLowerCase() === 'ftp') {
                putFileWithFtp(filePath);
            }
            if(settings['server']['type'].toLowerCase() === 'sftp') {
                putFileWithSftp(filePath);
            }
        } else {
            console.error("no type designated in server settings");
        }
    } else {
        console.error("no server settings");
    }
}

/**
 * gets file with FTP or SFTP, depending on type in settings.json
 * @param filePath path of file to get
 */
export function getFile(filePath: string) {
    let settings = vscode.workspace.getConfiguration().get('dw-file-check') as any;
    if(settings['server']) {
        if(settings['server']['type']){
            if(settings['server']['type'].toLowerCase() === 'ftp') {
                getFileWithFtp(filePath);
            }
            if(settings['server']['type'].toLowerCase() === 'sftp') {
                getFileWithSftp(filePath);
            }
        } else {
            console.error("no type designated in server settings");
        }
    } else {
        console.error("no server settings");
    }
}

/**
 * puts a file with FTP
 * @param filePath path of the file to put
 */
function putFileWithFtp(filePath: string) {
    let remotePath = getRemoteFilePath(filePath);
    let client = new ftp();
    client.on('ready', function() {
        client.put(filePath, remotePath, function(err) {
            if (err) { 
                vscode.window.showErrorMessage("FTP Error: " + err.message);
                console.log(err, 'FTP put error');
                throw err; 
            }
            client.end();
        });
    });
    client.connect(getServerConfig());
}

/**
 * puts a file with SFTP
 * @param filePath path of the file to put
 */
function putFileWithSftp(filePath: string) {
    let remotePath = getRemoteFilePath(filePath);
    let client = new sftp();
    client.connect(getServerConfig())
    .then(() => {
        client.put(filePath, remotePath);
    })
    .catch((err) => {
        vscode.window.showErrorMessage("SFTP Error: " + err.message);
        console.log(err, 'SFTP put error');
        throw err;
    });
}

/**
 * gets a file with FTP
 * @param filePath path of file to get
 */
export function getFileWithFtp(filePath: string) {
    let remotePath = getRemoteFilePath(filePath);
    let client = new ftp();
    client.on('ready', function() {
        client.get(remotePath, false, function(err, stream) {
            if (err) { 
                vscode.window.showErrorMessage("FTP Error: " + err.message);
                console.log(err, 'FTP get error');
                throw err; 
            } else {
                //write the file with stream to filePath
                stream.once('close', function() { client.end(); });
                stream.pipe(fs.createWriteStream(filePath));
            }
            client.end();
        });
    });
    client.connect(getServerConfig());
    
}

/**
 * gets a file with SFTP
 * @param filePath path of file to get
 */
export function getFileWithSftp(filePath: string) {
    let remotePath = getRemoteFilePath(filePath);
    let client = new sftp();
    client.connect(getServerConfig())
    .then(() => {
        client.get(remotePath, filePath);
    })
    .catch((err) => {
        vscode.window.showErrorMessage("SFTP Error: " + err.message);
        console.log(err, 'SFTP get error');
        throw err;
    });
}
