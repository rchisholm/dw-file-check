/**
 * contains the commands for dw-file-check
 */
import * as dw from "./dw-functions";
import * as vscode from 'vscode';
import * as username from 'username';

/**
 * registers commands for dw-file-check
 * @param context vscode Extension context
 */
export function registerDwCommands(context: vscode.ExtensionContext) {
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

            dw.checkInFile(context, currentFilePath);

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
        // called on pull file

        // always allow
        dw.pullCurrentFile();
    });

    let dwSaveFile = vscode.commands.registerCommand('extension.dwSaveFile', () => {
        // called on save file:
        dw.startSaveFile(context);
    });

    context.subscriptions.push(checkInCurrentFile, checkOutCurrentFile, dwPushCurrentFile, dwPullCurrentFile, dwSaveFile);
}
        