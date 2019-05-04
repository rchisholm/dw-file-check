/**
 * contains the status bar buttons for this extension
 */
import * as vscode from 'vscode';

export function addDwButtons(context: vscode.ExtensionContext){
    let pullButton: vscode.StatusBarItem;
    let pushButton: vscode.StatusBarItem;
    let checkOutButton: vscode.StatusBarItem;
    let checkInButton: vscode.StatusBarItem;

    pullButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 23);
    pushButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 22);
    checkOutButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 21);
    checkInButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);

    pullButton.command = 'extension.dwPullCurrentFile';
    pushButton.command = 'extension.dwPushCurrentFile';
    checkOutButton.command = 'extension.dwCheckOutCurrentFile';
    checkInButton.command = 'extension.dwCheckInCurrentFile';

    pullButton.text = "Pull File $(arrow-down)";
    pushButton.text = "Push File $(arrow-up)";
    checkOutButton.text = "Check Out $(check)";
    checkInButton.text = "Check In $(lock)";

    // pullButton.color = "#bada55";
    // pushButton.color = "#00ffff";
    // checkOutButton.color="#00ff00";
    // checkInButton.color="#ffa500";

    context.subscriptions.push(pullButton, pushButton, checkOutButton, checkInButton);

    pullButton.show();
    pushButton.show();
    checkOutButton.show();
    checkInButton.show();
}