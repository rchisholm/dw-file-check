
import * as fs from 'fs';
import * as dwUtil from './dw-utils';
import * as vscode from 'vscode';
import * as ftp from 'ftp';
import * as sftp from 'ssh2-sftp-client';

function getRemoteDir(): string {
    let settings = vscode.workspace.getConfiguration().get('dw-file-check') as any;
	if(settings['server']['dir']) { 
        return settings['server']['dir']; 
    } else {
        console.error("no server.dir setting found!");
        return "";
    }
}

function getRemoteFilePath(filePath: string) {
    let workspacePath = vscode.workspace.rootPath;
    if(!workspacePath) {
        console.error("no workspace path...");
        return filePath;
    } else {
        let relPath = filePath.replace(workspacePath + dwUtil.getSlash(), "");
        let remotePath = dwUtil.serverPath(getRemoteDir() + relPath);
        console.warn("filePath: " + filePath);
        console.warn("workspacePath: " + workspacePath);
        console.warn("relPath: " + relPath);
        console.warn("remotePath: " + remotePath);
        return remotePath;
    }
}

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
    }
    return serverConfig;
}

//not tested yet
export function pushFileWithFtp(filePath: string) {
    let remotePath = getRemoteFilePath(filePath);
    let client = new ftp();
    client.on('ready', function() {
        client.put(filePath, remotePath, function(err) {
            if (err) { throw err; }
            client.end();
        });
    });
    client.connect(getServerConfig());
}


export function pushFileWithSftp(filePath: string) {
    let remotePath = getRemoteFilePath(filePath);
    let client = new sftp();
    client.connect(getServerConfig())
    .then(() => {
        client.put(filePath, remotePath);
    })
    .catch((err) => {
        console.log(err, 'catch error');
    });
}