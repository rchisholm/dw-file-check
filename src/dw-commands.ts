/**
 * contains the commands for dw-file-check
 */
import * as dw from "./dw-functions";
import * as vscode from 'vscode';

/**
 * registers commands for dw-file-check
 * @param context vscode Extension context
 */
export function registerDwCommands(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    
    let dwCheckInCurrentFile = vscode.commands.registerCommand('extension.dwCheckInCurrentFile', () => {
        // check in file
        //vscode.window.showInformationMessage("Checking in...");

        if(vscode.window.activeTextEditor){
            let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
            //vscode.window.showInformationMessage(currentFilePath);

            dw.checkInFile(context, currentFilePath);

        } else {
            vscode.window.showInformationMessage("No open file.");
        }

    });

    let dwCheckOutCurrentFile = vscode.commands.registerCommand('extension.dwCheckOutCurrentFile', () => {
        // check out file
        //vscode.window.showInformationMessage("Checking out...");

        if(vscode.window.activeTextEditor){
            let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
            //vscode.window.showInformationMessage(currentFilePath);
            dw.checkOutFile(context, currentFilePath);
        } else {
            vscode.window.showErrorMessage("No open file.");
        }
    });

    let dwPushCurrentFile = vscode.commands.registerCommand('extension.dwPushCurrentFile', () => {
        // called on push file
        dw.startPushCurrentFile(context);

    });

    let dwPullCurrentFile = vscode.commands.registerCommand('extension.dwPullCurrentFile', () => {
        // called on pull file - always allow
        dw.pullCurrentFile();
    });

    let dwSaveFile = vscode.commands.registerCommand('extension.dwSaveFile', () => {
        // called on save file:
        dw.startSaveFile(context);
    });

    let dwCheckFileStatus = vscode.commands.registerCommand('extension.dwCheckFileStatus', (fileOrFolder: vscode.Uri) => {
        // show file status/owner in information message
        dw.checkFileStatus(context, fileOrFolder);
    });

    let dwOpenFileOptions = vscode.commands.registerCommand('extension.dwOpenFileOptions', (fileOrFolder: vscode.Uri) => {
        // open a list of dw file check commands
        dw.openFileOptions(context, fileOrFolder);
    });

    context.subscriptions.push(
        dwCheckInCurrentFile, 
        dwCheckOutCurrentFile, 
        dwPushCurrentFile, 
        dwPullCurrentFile, 
        dwSaveFile,
        dwCheckFileStatus,
        dwOpenFileOptions
    );
}
        