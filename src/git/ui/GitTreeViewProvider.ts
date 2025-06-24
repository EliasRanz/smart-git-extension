import * as vscode from 'vscode';
import { GitService } from '../GitService';

type TreeDataChangeEvent = GitTreeItem | undefined | null | void;

export class GitTreeViewProvider implements vscode.TreeDataProvider<GitTreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataChangeEvent> = new vscode.EventEmitter<TreeDataChangeEvent>();
    public readonly onDidChangeTreeData: vscode.Event<TreeDataChangeEvent> = this._onDidChangeTreeData.event;

    public constructor(private readonly gitService: GitService) {
        // Future: Listen for git state changes to refresh tree
        // this.gitService.onDidGitStateChange(() => this.refresh());
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: GitTreeItem): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: GitTreeItem): Promise<GitTreeItem[]> {
        if (!element) {
            // Root level - show placeholder for now
            return [
                new GitTreeItem(
                    "Git Tree Coming Soon!",
                    "This will show IntelliJ-style commit history and branch visualization",
                    vscode.TreeItemCollapsibleState.None,
                    'info'
                )
            ];
        }
        
        return [];
    }
}

class GitTreeItem extends vscode.TreeItem {
    public constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.contextValue = contextValue;
        
        if (contextValue === 'info') {
            this.iconPath = new vscode.ThemeIcon('info');
        }
    }
}
