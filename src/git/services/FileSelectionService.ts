import * as vscode from 'vscode';
import { Repository } from '../git.d';

/**
 * Service responsible for managing file selection state for commits.
 * Handles storing, retrieving, and updating selected files per repository.
 */
export class FileSelectionService {
    private readonly _context: vscode.ExtensionContext;

    public constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    /**
     * Gets all changed files for a repository (staged, unstaged, and untracked).
     * @param repository The git repository
     * @returns Array of URIs for changed files
     */
    public async getChangedFiles(repository: Repository): Promise<vscode.Uri[]> {
        // This combines staged (index), unstaged (working tree), and untracked changes.
        const changedFiles = [
            ...repository.state.indexChanges,
            ...repository.state.workingTreeChanges,
            ...repository.state.untrackedChanges
        ];
        
        // The VS Code API can sometimes return duplicates, so we ensure uniqueness.
        const uris = changedFiles.map(change => change.uri);
        const uniqueFilePaths = [...new Set(uris.map(uri => uri.fsPath))];
        return uniqueFilePaths.map(fsPath => vscode.Uri.file(fsPath));
    }

    /**
     * Gets the list of currently selected files for a repository.
     * @param repoUri The repository root URI
     * @returns Array of selected file URIs
     */
    public getSelectedFiles(repoUri: vscode.Uri): vscode.Uri[] {
        const selected = this._context.workspaceState.get<string[]>(
            `selected-files:${repoUri.fsPath}`, 
            []
        );
        return selected.map(fsPath => vscode.Uri.file(fsPath));
    }

    /**
     * Toggles the selection state of a file.
     * @param fileUri The file URI to toggle
     * @param repoUri The repository root URI
     */
    public async toggleFileSelection(fileUri: vscode.Uri, repoUri: vscode.Uri): Promise<void> {
        const repoPath = repoUri.fsPath;
        const selectedPaths = this._context.workspaceState.get<string[]>(
            `selected-files:${repoPath}`, 
            []
        );
        const filePath = fileUri.fsPath;
        
        const index = selectedPaths.indexOf(filePath);
        if (index > -1) {
            selectedPaths.splice(index, 1);
        } else {
            selectedPaths.push(filePath);
        }
        
        await this._context.workspaceState.update(`selected-files:${repoPath}`, selectedPaths);
    }

    /**
     * Sets the selection state of a file explicitly.
     * @param fileUri The file URI
     * @param repoUri The repository root URI
     * @param isSelected Whether the file should be selected
     */
    public async setFileSelection(
        fileUri: vscode.Uri, 
        repoUri: vscode.Uri, 
        isSelected: boolean
    ): Promise<void> {
        const repoPath = repoUri.fsPath;
        const selectedPaths = this._context.workspaceState.get<string[]>(
            `selected-files:${repoPath}`, 
            []
        );
        const filePath = fileUri.fsPath;
        
        const index = selectedPaths.indexOf(filePath);
        if (isSelected && index === -1) {
            selectedPaths.push(filePath);
        } else if (!isSelected && index > -1) {
            selectedPaths.splice(index, 1);
        }
        
        await this._context.workspaceState.update(`selected-files:${repoPath}`, selectedPaths);
    }

    /**
     * Clears all selected files for a repository.
     * @param repoUri The repository root URI
     */
    public async clearSelection(repoUri: vscode.Uri): Promise<void> {
        await this._context.workspaceState.update(`selected-files:${repoUri.fsPath}`, []);
    }
}
