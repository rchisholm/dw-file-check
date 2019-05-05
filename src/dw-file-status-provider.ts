import * as vscode from 'vscode';
import * as utils from './dw-utils';
import * as dwStatus from './dw-status';

export class FileStatusProvider implements vscode.TreeDataProvider<DwFile> {

	constructor(private workspaceRoot?: string) {}

    getTreeItem(file: DwFile): vscode.TreeItem {
        return file;
    }

    getChildren(file?: DwFile): Thenable<DwFile[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No files in empty workspace');
			return Promise.resolve([]);
        }
        
        if(file){
            if(utils.isFolder(file.path)) {
                // return the files in this folder
            } else {
                // return empty array
                console.warn("file was empty...");
                return Promise.resolve([]);
            }
        } else {
            // there was no file? not sure how we get this condition
            console.warn("file returned false...");
            return Promise.resolve([]);
        }

        return Promise.resolve([]);
    }

}

export class DwFile extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public status: string,
        public owner: string,
        public path: string
    ) {
        super(label, collapsibleState);
    }

    /**
     * returns the icon to represent the file's status
     */
    getIcon(): string {
        switch(this.status) {
            case 'locked': 
            return '$(lock)';

            case 'out':
            return '$(check)';

            default:
            return '';
        }
    }

    /**
     * returns the hex color of the icon for the file's status
     * @param context vscode extension context
     */
    getColor(context: vscode.ExtensionContext): string {
        switch(this.status) {
            case 'locked': 
            return '#e5e6e8';

            case 'out':
            return (utils.getUserName(context) === this.owner) ?  "#02cc00" : "#ff0000";

            default:
            return '#ffffff';
        }
    }
}