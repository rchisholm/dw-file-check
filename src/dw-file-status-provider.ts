import * as vscode from 'vscode';
import * as utils from './dw-utils';
import * as fs from 'fs';
import * as path from 'path';
import * as dwStatus from './dw-status';

export class FileStatusProvider implements vscode.TreeDataProvider<DwFile> {

    constructor(private context: vscode.ExtensionContext, private workspaceRoot?: string) {}

	private _onDidChangeTreeData: vscode.EventEmitter<DwFile | undefined> = new vscode.EventEmitter<DwFile | undefined>();
    readonly onDidChangeTreeData: vscode.Event<DwFile | undefined> = this._onDidChangeTreeData.event;
    
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(file: DwFile): vscode.TreeItem {
        return file;
    }

    getChildren(element?: DwFile): Thenable<DwFile[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No files in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            if(utils.isFolder(element.filePath)) {
                return Promise.resolve(this.getDwFiles(element.filePath));
            } else {
                return Promise.resolve([]);
            }
        } else {
            // root
            if (this.pathExists(this.workspaceRoot)) {
                return Promise.resolve(this.getDwFiles(this.workspaceRoot));
            } else {
                vscode.window.showInformationMessage('Workspace has no files');
                return Promise.resolve([]);
            }
        }
    }

    private getDwFiles(path: string): DwFile[] {
        let dwFiles: DwFile[] = [];
        if(path) {
            let filePaths = fs.readdirSync(path);
            filePaths.forEach(filePath => {
                //console.warn(file);
                filePath = path + utils.getSlash() + filePath;
                if(!utils.isExcludedFile(filePath)) {
                    let collapse = utils.isFolder(filePath) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
                    //console.warn(file);
                    dwFiles.push(new DwFile(
                        this.context,
                        utils.getFileName(filePath),
                        vscode.Uri.file(filePath),
                        collapse,
                        //this.getDwFileIcon(this.context, filePath),
                        //"media/dw2.png",
                        dwStatus.getFileStatus(this.context, filePath),
                        dwStatus.getFileOwner(this.context, filePath),
                        filePath
                    ));
                }
            });
        } 
        //console.error("dwFiles:");
        //console.log(dwFiles);
        return dwFiles;
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }

        return true;
    }

    

    /**
     * returns the icon to represent the file's status
     */
    getDwFileIcon(context: vscode.ExtensionContext, filePath: string): string {
        switch(dwStatus.getFileStatus(context, filePath)) {
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
    getDwFileColor(context: vscode.ExtensionContext, filePath: string): string {
        switch(dwStatus.getFileStatus(context, filePath)) {
            case 'locked': 
            return '#e5e6e8';

            case 'out':
            return (utils.getUserName(context) === dwStatus.getFileOwner(context, filePath)) ?  "#02cc00" : "#ff0000";

            default:
            return '#ffffff';
        }
    }
}


export class DwFile extends vscode.TreeItem {

    constructor(
        private context: vscode.ExtensionContext,
        public readonly label: string,
        public readonly resourceUri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        //public iconPath: string,
        public status: string,
        public owner: string,
        public filePath: string
    ) {
        super(label, collapsibleState);
    }
	get tooltip(): string {

        switch(this.status) {
            case "locked":
            return "Checked in (locked)";

            case "out":
            return "Checked out by " + this.owner;

            default:
            return "Unlocked.";
        }
	}

	get description(): string {
        //return this.filePath;
        return "";
    }
    
    get iconPath(): string {
        if(utils.isFolder(this.filePath)) {
            return "";
        }
        let icon: string;
        
        switch(this.status) {
            case 'locked': 
            icon = "lock.png";
            break;

            case 'out':
            icon = (utils.getUserName(this.context) === this.owner) ?  "green-check.png" : "red-check.png";
            break;

            default:
            icon = '';
        }

        return path.join(__filename, '..', '..', 'media', icon);
    }
}