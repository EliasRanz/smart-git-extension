import * as vscode from 'vscode';
import { getGitApi } from './src/git/GitApi';
import { GitService } from './src/git/GitService';
import { CommitViewProvider } from './src/git/ui/CommitViewProvider';
import { CommitPanelProvider } from './src/git/ui/CommitPanelProvider';
import { GitTreeViewProvider } from './src/git/ui/GitTreeViewProvider';
import { registerCommands } from './src/git/commands/commands';

/**
 * This method is called when your extension is activated.
 * The extension is activated the very first time the command is executed.
 */
export async function activate(context: vscode.ExtensionContext) {
    try {
        console.log('Congratulations, your extension "smart-git" is now active!');

        // Get the Git API from the built-in Git extension
        console.log('Getting Git API...');
        const gitApi = await getGitApi();

        if (!gitApi) {
            console.error('Git API not found');
            vscode.window.showErrorMessage('Could not find Git extension. Please ensure it is installed and enabled.');
            return;
        }

        console.log('Git API found, state:', gitApi.state);
        console.log('Initial repositories:', gitApi.repositories.length);

        // Wait for the Git API to be initialized. This prevents a race condition on startup
        // where the extension tries to access repositories before the Git extension has found them.
        if (gitApi.state !== 'initialized') {
            console.log('Waiting for Git API to initialize...');
            await new Promise<void>(resolve => {
                const disposable = gitApi.onDidChangeState(e => {
                    console.log('Git API state changed to:', e);
                    if (e === 'initialized') {
                        disposable.dispose();
                        resolve();
                    }
                });
            });
        }

        console.log('Git API initialized, repositories:', gitApi.repositories.length);

        // Initialize the Git service layer
        const gitService = new GitService(gitApi, context);
        await gitService.updateRepositories();
        
        console.log('GitService initialized, repositories:', gitService.getRepositories().length);

        // Initialize the Tree View for displaying file changes
        const commitViewProvider = new CommitViewProvider(gitService);
        const treeView = vscode.window.createTreeView('smart-git-view.changes', {
            treeDataProvider: commitViewProvider,
            showCollapseAll: true,
            canSelectMany: false
        });
        
        // Handle checkbox state changes
        treeView.onDidChangeCheckboxState((e) => {
            commitViewProvider.onDidChangeCheckboxState(e);
        });

        // Initialize the Webview Panel for the commit message and actions
        const commitPanelProvider = new CommitPanelProvider(context.extensionUri, gitService);
        vscode.window.registerWebviewViewProvider('smart-git-view.commit-panel', commitPanelProvider);
        
        // Initialize the Git Tree View (placeholder for now)
        const gitTreeProvider = new GitTreeViewProvider(gitService);
        vscode.window.createTreeView('smart-git-view.tree', {
            treeDataProvider: gitTreeProvider,
            showCollapseAll: true
        });
        
        // Register all commands for the extension
        registerCommands(context, gitService, commitViewProvider);

        // Refresh the view when the Git state changes
        gitService.onDidGitStateChange(() => {
            commitViewProvider.refresh();
            // You might want to update the webview as well if it displays state-dependent info
        });
    } catch (error: any) {
        console.error("Failed to activate Smart Git extension:", error);
        vscode.window.showErrorMessage(`Failed to activate Smart Git extension: ${error.message}`);
    }
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {
    // Cleanup if needed
}
