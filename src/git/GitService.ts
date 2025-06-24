import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { API as GitAPI, Repository } from './git.d';
import { FileSelectionService } from './services/FileSelectionService';
import { GitDiffService } from './services/GitDiffService';
import { CommitMessageGenerator } from './services/CommitMessageGenerator';
import { GitValidationService } from './services/GitValidationService';

/**
 * Main Git service that coordinates all Git-related operations.
 * Provides a unified interface for Git operations in the Smart Git extension.
 */
export class GitService {
    private readonly _gitApi: GitAPI;
    private readonly _context: vscode.ExtensionContext;
    private _repositories: Repository[] = [];
    private readonly _simpleGitInstances: Map<string, SimpleGit> = new Map();

    private readonly _onDidGitStateChange = new vscode.EventEmitter<void>();
    public readonly onDidGitStateChange: vscode.Event<void> = this._onDidGitStateChange.event;

    // Service dependencies
    private readonly _fileSelectionService: FileSelectionService;
    private readonly _diffService: GitDiffService;
    private readonly _commitMessageGenerator: CommitMessageGenerator;
    private readonly _validationService: GitValidationService;

    public constructor(gitApi: GitAPI, context: vscode.ExtensionContext) {
        this._gitApi = gitApi;
        this._context = context;

        // Initialize services
        this._fileSelectionService = new FileSelectionService(context);
        this._diffService = new GitDiffService(this._simpleGitInstances);
        this._commitMessageGenerator = new CommitMessageGenerator(this._simpleGitInstances, this._diffService);
        this._validationService = new GitValidationService();

        // Listen for changes in the Git extension state
        this._gitApi.onDidOpenRepository(() => this.updateRepositories());
        this._gitApi.onDidCloseRepository(() => this.updateRepositories());
    }

    /**
     * Updates the list of repositories and sets up SimpleGit instances.
     */
    public async updateRepositories(): Promise<void> {
        this._repositories = this._gitApi.repositories;
        this._repositories.forEach(repo => {
            if (!this._simpleGitInstances.has(repo.rootUri.fsPath)) {
                this._simpleGitInstances.set(repo.rootUri.fsPath, simpleGit(repo.rootUri.fsPath));
            }
            // Listen for changes within each repository
            repo.state.onDidChange(() => {
                this._onDidGitStateChange.fire();
            });
        });
        this._onDidGitStateChange.fire();
    }

    /**
     * Gets all repositories managed by the Git extension.
     * @returns Array of repositories
     */
    public getRepositories(): Repository[] {
        return this._repositories;
    }

    // File Selection Operations

    /**
     * Gets all changed files for a repository.
     * @param repository The git repository
     * @returns Array of changed file URIs
     */
    public async getChangedFiles(repository: Repository): Promise<vscode.Uri[]> {
        return this._fileSelectionService.getChangedFiles(repository);
    }

    /**
     * Gets currently selected files for a repository.
     * @param repoUri The repository root URI
     * @returns Array of selected file URIs
     */
    public getSelectedFiles(repoUri: vscode.Uri): vscode.Uri[] {
        return this._fileSelectionService.getSelectedFiles(repoUri);
    }

    /**
     * Toggles the selection state of a file.
     * @param fileUri The file URI to toggle
     * @param repoUri The repository root URI
     */
    public async toggleFileSelection(fileUri: vscode.Uri, repoUri: vscode.Uri): Promise<void> {
        await this._fileSelectionService.toggleFileSelection(fileUri, repoUri);
        this._onDidGitStateChange.fire();
    }

    /**
     * Sets the selection state of a file explicitly.
     * @param fileUri The file URI
     * @param repoUri The repository root URI  
     * @param isSelected Whether the file should be selected
     */
    public async setFileSelection(fileUri: vscode.Uri, repoUri: vscode.Uri, isSelected: boolean): Promise<void> {
        await this._fileSelectionService.setFileSelection(fileUri, repoUri, isSelected);
        this._onDidGitStateChange.fire();
    }

    // Git Operations

    /**
     * Stages the selected files for commit.
     * @param repository The git repository
     */
    public async stageSelectedFiles(repository: Repository): Promise<void> {
        const selectedUris = this.getSelectedFiles(repository.rootUri);
        console.log(`Staging ${selectedUris.length} selected files:`, selectedUris.map(uri => uri.fsPath));
        
        if (selectedUris.length === 0) {
            throw new Error('No files selected for staging');
        }
        
        try {
            // Stage each selected file
            for (const uri of selectedUris) {
                await repository.add([uri]);
            }
            console.log('Successfully staged selected files');
        } catch (error: unknown) {
            console.error('Failed to stage files:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to stage files: ${errorMessage}`);
        }
    }

    /**
     * Commits the staged changes with the provided message.
     * @param repository The git repository
     * @param message The commit message
     * @param amend Whether to amend the last commit
     */
    public async commit(repository: Repository, message: string, amend: boolean): Promise<void> {
        if (!message.trim()) {
            throw new Error('Commit message cannot be empty');
        }

        try {
            console.log(`Committing with message: "${message}", amend: ${amend}`);
            
            if (amend) {
                await repository.commit(message, { amend: true });
            } else {
                await repository.commit(message);
            }
            
            console.log('Commit successful');
            
            // Clear selection after successful commit
            await this._fileSelectionService.clearSelection(repository.rootUri);
            this._onDidGitStateChange.fire();
            
        } catch (error: unknown) {
            console.error('Commit failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Commit failed: ${errorMessage}`);
        }
    }

    /**
     * Commits and pushes changes in one operation.
     * @param repository The git repository
     * @param message The commit message
     * @param amend Whether to amend the last commit
     */
    public async commitAndPush(repository: Repository, message: string, amend: boolean): Promise<void> {
        // First commit
        await this.commit(repository, message, amend);
        
        // Then push
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Pushing changes...",
            cancellable: false
        }, async () => {
            try {
                await repository.push();
                vscode.window.showInformationMessage('Push successful.');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Push failed: ${errorMessage}`);
                console.error(error);
            }
        });
    }

    // Diff Operations

    /**
     * Shows the diff for a specific file.
     * @param fileUri The file URI to show diff for
     * @param repository The git repository
     */
    public async showFileDiff(fileUri: vscode.Uri, repository: Repository): Promise<void> {
        return this._diffService.showFileDiff(fileUri, repository);
    }

    // AI Commit Message Generation

    /**
     * Generates an AI-powered commit message based on selected files.
     * @param repository The git repository
     * @returns Generated commit message or undefined if failed
     */
    public async generateCommitMessage(repository: Repository): Promise<string | undefined> {
        const selectedFiles = this.getSelectedFiles(repository.rootUri);
        return this._commitMessageGenerator.generateCommitMessage(repository, selectedFiles);
    }

    // Validation

    /**
     * Validates the commit setup for a repository.
     * @param repository The git repository
     * @returns Validation result with any issues found
     */
    public async validateCommitSetup(repository: Repository): Promise<{isValid: boolean, issues: string[]}> {
        const selectedFiles = this.getSelectedFiles(repository.rootUri);
        const changedFiles = await this.getChangedFiles(repository);
        return this._validationService.validateCommitSetup(repository, selectedFiles, changedFiles);
    }
}
