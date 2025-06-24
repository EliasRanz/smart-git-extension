import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../GitService';
import { Repository } from '../git.d';

interface Change {
    uri: vscode.Uri;
    status: number;
}

type TreeDataChangeEvent = vscode.TreeItem | undefined | null | void;

export class CommitViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataChangeEvent> = new vscode.EventEmitter<TreeDataChangeEvent>();
    public readonly onDidChangeTreeData: vscode.Event<TreeDataChangeEvent> = this._onDidChangeTreeData.event;

    public constructor(private readonly gitService: GitService) {
        this.gitService.onDidGitStateChange(() => this.refresh());
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the change type label for a given status number.
     */
    private getChangeTypeLabel(status: number): string {
        // VS Code Git status mapping
        switch (status) {
            case 0: return 'M'; // Modified
            case 1: return 'A'; // Added
            case 2: return 'D'; // Deleted
            case 3: return 'R'; // Renamed
            case 4: return 'C'; // Copied
            case 5: return 'U'; // Untracked
            case 6: return 'I'; // Ignored
            case 7: return 'M'; // Intent to add
            default: return 'M'; // Default to modified
        }
    }

    /**
     * Handles checkbox state changes for file selection.
     */
    public onDidChangeCheckboxState(items: vscode.TreeCheckboxChangeEvent<vscode.TreeItem>): void {
        items.items.forEach(([item, state]) => {
            if (item instanceof FileTreeItem) {
                const isSelected = state === vscode.TreeItemCheckboxState.Checked;
                // Update the selection state in GitService
                this.gitService.setFileSelection(item.resourceUri, item.repository.rootUri, isSelected);
            }
        });
        // Refresh the tree to update the UI
        this.refresh();
    }

    /**
     * Gets the tree item representation for display.
     */
    public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets children for the tree view.
     */
    public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            return this.getRootLevelItems();
        }

        if (element instanceof RepositoryTreeItem) {
            return this.getRepositoryFiles(element);
        }

        return [];
    }

    /**
     * Gets root level items (repositories).
     */
    private async getRootLevelItems(): Promise<vscode.TreeItem[]> {
        const repos = this.gitService.getRepositories();
        if (repos.length === 0) {
            return [new vscode.TreeItem("No Git repositories found.")];
        }

        const repoTreeItems = await Promise.all(repos.map(async (repo) => {
            const changedFiles = await this.gitService.getChangedFiles(repo);
            return new RepositoryTreeItem(repo, changedFiles.length);
        }));

        return repoTreeItems;
    }

    /**
     * Gets files for a specific repository.
     */
    private async getRepositoryFiles(element: RepositoryTreeItem): Promise<vscode.TreeItem[]> {
        const changedFiles = await this.gitService.getChangedFiles(element.repository);
        const selectedFiles = this.gitService.getSelectedFiles(element.repository.rootUri);
        const selectedFilePaths = selectedFiles.map(uri => uri.fsPath);

        return changedFiles.map(uri => {
            const isSelected = selectedFilePaths.includes(uri.fsPath);
            const changeInfo = this.getFileChangeInfo(element.repository, uri);
            
            return new FileTreeItem(
                uri, 
                element.repository, 
                isSelected,
                changeInfo.label
            );
        });
    }

    /**
     * Gets change information for a file.
     */
    private getFileChangeInfo(repository: Repository, uri: vscode.Uri): { status: number; label: string } {
        const changes = this.findFileChanges(repository, uri);
        
        if (changes.untrackedChange) {
            return { status: 5, label: 'U' }; // Untracked
        }
        
        if (changes.indexChange && changes.workingTreeChange) {
            return { status: changes.indexChange.status, label: 'MM' }; // Modified in both index and working tree
        }
        
        if (changes.indexChange) {
            return { status: changes.indexChange.status, label: this.getChangeTypeLabel(changes.indexChange.status) };
        }
        
        if (changes.workingTreeChange) {
            return { status: changes.workingTreeChange.status, label: this.getChangeTypeLabel(changes.workingTreeChange.status) };
        }
        
        return { status: 0, label: 'M' }; // Default to modified
    }

    /**
     * Finds file changes in repository state.
     */
    private findFileChanges(repository: Repository, uri: vscode.Uri): {
        indexChange?: Change;
        workingTreeChange?: Change;
        untrackedChange?: Change;
    } {
        return {
            indexChange: repository.state.indexChanges.find((change: Change) => change.uri.fsPath === uri.fsPath),
            workingTreeChange: repository.state.workingTreeChanges.find((change: Change) => change.uri.fsPath === uri.fsPath),
            untrackedChange: repository.state.untrackedChanges.find((change: Change) => change.uri.fsPath === uri.fsPath)
        };
    }
}

class RepositoryTreeItem extends vscode.TreeItem {
    public constructor(
        public readonly repository: Repository,
        public readonly fileCount: number
    ) {
        const repoName = path.basename(repository.rootUri.fsPath);
        // Display the number of changed files next to the repository name.
        const label = `${repoName} (${fileCount} files)`;
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        
        this.description = repository.state.HEAD?.name; // Show the current branch
        this.iconPath = new vscode.ThemeIcon('repo');
    }
}


class FileTreeItem extends vscode.TreeItem {
    public constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly repository: Repository,
        public readonly isSelected: boolean,
        public readonly changeType: string = ''
    ) {
        const fileName = path.basename(resourceUri.path);
        const displayName = changeType ? `${fileName} (${changeType})` : fileName;
        super(displayName);
        
        this.description = path.dirname(vscode.workspace.asRelativePath(resourceUri));
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        
        // Use checkbox instead of command for selection
        this.checkboxState = isSelected ? 
            vscode.TreeItemCheckboxState.Checked : 
            vscode.TreeItemCheckboxState.Unchecked;
        
        // No icons - clean interface like IntelliJ
        this.iconPath = undefined;
        
        // Set command to show diff when clicked (not toggle selection)
        this.command = {
            command: 'smart-git.showFileDiff',
            title: "Show File Diff",
            arguments: [this]
        };
        
        // Add context value for context menu
        this.contextValue = 'fileTreeItem';
    }
}
