import * as vscode from 'vscode';
import { SimpleGit } from 'simple-git';
import { Repository } from '../git.d';

/**
 * Service responsible for showing file diffs and handling diff-related operations.
 */
export class GitDiffService {
    private readonly _simpleGitInstances: Map<string, SimpleGit>;

    public constructor(simpleGitInstances: Map<string, SimpleGit>) {
        this._simpleGitInstances = simpleGitInstances;
    }

    /**
     * Shows the diff for a specific file.
     * @param fileUri The file URI to show diff for
     * @param repository The git repository
     */
    public async showFileDiff(fileUri: vscode.Uri, repository: Repository): Promise<void> {
        try {
            // Check if this is a staged or unstaged change
            const stagedChanges = repository.state.indexChanges;
            const workingTreeChanges = repository.state.workingTreeChanges;
            const untrackedChanges = repository.state.untrackedChanges;
            
            const isStaged = stagedChanges.some(change => change.uri.fsPath === fileUri.fsPath);
            const isWorkingTree = workingTreeChanges.some(change => change.uri.fsPath === fileUri.fsPath);
            const isUntracked = untrackedChanges.some(change => change.uri.fsPath === fileUri.fsPath);
            
            if (isUntracked) {
                await this.showUntrackedFileDiff(fileUri);
            } else if (isStaged || isWorkingTree) {
                // Use VS Code's built-in Git diff command - this is the most reliable
                await vscode.commands.executeCommand('git.openChange', fileUri);
            } else {
                // If no changes detected, show info message
                vscode.window.showInformationMessage('No changes detected for this file.');
            }
        } catch (error: unknown) {
            console.error('Failed to show diff:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to show diff: ${errorMessage}`);
        }
    }

    /**
     * Shows diff for an untracked file by comparing with empty content.
     * @param fileUri The untracked file URI
     */
    private async showUntrackedFileDiff(fileUri: vscode.Uri): Promise<void> {
        const fileName = fileUri.fsPath.split('/').pop() ?? 'file';
        const emptyContent = '';
        
        // Create a temporary document with empty content
        const emptyDoc = await vscode.workspace.openTextDocument({
            content: emptyContent,
            language: this.getLanguageFromExtension(fileName)
        });
        
        await vscode.commands.executeCommand('vscode.diff', 
            emptyDoc.uri, 
            fileUri, 
            `${fileName} (Untracked)`);
    }

    /**
     * Gets the file language based on file extension.
     * @param filename The filename
     * @returns The language identifier
     */
    private getLanguageFromExtension(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase() ?? '';
        const languageMap: { [key: string]: string } = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'kt': 'kotlin',
            'swift': 'swift',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'txt': 'plaintext'
        };
        return languageMap[extension] || 'plaintext';
    }

    /**
     * Gets the git diff for a file.
     * @param repository The git repository
     * @param fileUri The file URI
     * @param relativePath The relative path of the file
     * @param changeType The type of change (A, M, D, etc.)
     * @returns The diff string
     */
    public async getFileDiff(
        repository: Repository, 
        fileUri: vscode.Uri, 
        relativePath: string, 
        changeType: string
    ): Promise<string> {
        if (changeType === 'A') {
            return this.getNewFileDiff(fileUri, relativePath);
        } else {
            return this.getGitDiff(repository, relativePath, changeType);
        }
    }

    /**
     * Gets diff for a new file by showing its content as additions.
     * @param fileUri The file URI
     * @param relativePath The relative path
     * @returns The diff string
     */
    private async getNewFileDiff(fileUri: vscode.Uri, relativePath: string): Promise<string> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const content = document.getText();
            const lines = content.split('\n');
            return `+++ ${relativePath}\n` + 
                   lines.map(line => `+${line}`).slice(0, 50).join('\n') + 
                   (lines.length > 50 ? '\n... (truncated)' : '');
        } catch {
            return `New file: ${relativePath}`;
        }
    }

    /**
     * Gets git diff using simple-git.
     * @param repository The git repository
     * @param relativePath The relative path
     * @param changeType The change type
     * @returns The diff string
     */
    private async getGitDiff(
        repository: Repository, 
        relativePath: string, 
        changeType: string
    ): Promise<string> {
        const git = this._simpleGitInstances.get(repository.rootUri.fsPath);
        if (git) {
            try {
                const gitDiff = await git.diff(['HEAD', '--', relativePath]);
                let diff = gitDiff || `${changeType}: ${relativePath}`;
                
                // Truncate very long diffs
                if (diff.length > 2000) {
                    const lines = diff.split('\n');
                    diff = lines.slice(0, 50).join('\n') + '\n... (diff truncated for AI analysis)';
                }
                return diff;
            } catch (gitError) {
                console.warn('Failed to get git diff:', gitError);
            }
        }
        return `${changeType}: ${relativePath}`;
    }
}
