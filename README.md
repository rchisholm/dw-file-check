# dw-file-check

## Features

Using mkloubert's <a href="https://github.com/mkloubert/vscode-deploy-reloaded">vscode-deploy-reloaded</a>, imitates the behavior of Adobe Dreamweaver's file check-in/check-out system, including push/pull to server, to allow teams using Dreamweaver to transition to vscode.

Perform the operations "check in", "check out", "push", and "pull" on current file via commands and buttons in the action bar. 

Perform the operations "Check File Status..." and "DW File Options..." on right-clicking in the file explorer to see that file's status (checked out by username, checked in, etc) and perform the basic commands on the selected file.

On opening a workspace, checks for deploy-reloaded configuration in settings.json, and if they are not present, prompts the user for necessary info to create that configuration (similar to the "server" settings GUI in Dreamweaver).

Provides a tree view of the directory structure and files (similar view to Dreamweaver).

## Extension Settings

In settings.json, add these settings:

"dw.username": "userName",

"dw.email": "userEmail@email.com"

This should preferably be set in the user level settings rather than the workspace level settings.

## Requirements

mkloubert's <a href="https://github.com/mkloubert/vscode-deploy-reloaded">vscode-deploy-reloaded</a>

## Known Issues

Does not support operations for non-text files (binary, image).

TODO: on rename file, update workspace state status: old file name -> status unlocked, user ""; new file name -> status & owner = old name status & owner

## Release Notes

### 0.0.1

In development
