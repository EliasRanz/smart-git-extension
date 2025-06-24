import * as vscode from 'vscode';
import { GitService } from '../GitService';
import { CommitViewProvider } from '../ui/CommitViewProvider';
import { Repository } from '../git.d';

export class FileTreeItem extends vscode.TreeItem {
    public constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly repository: Repository
    ) {
        super(resourceUri);
    }
}

export function registerCommands(
    context: vscode.ExtensionContext,
    gitService: GitService,
    _commitViewProvider: CommitViewProvider
): vscode.Disposable[] {
    const fileCommands = registerFileCommands(gitService);
    const messageCommands = registerMessageCommands(gitService);
    const utilityCommands = registerUtilityCommands(gitService);
    
    const allCommands = [...fileCommands, ...messageCommands, ...utilityCommands];
    context.subscriptions.push(...allCommands);
    
    return allCommands;
}

function registerFileCommands(gitService: GitService): vscode.Disposable[] {
    const refreshCommand = vscode.commands.registerCommand('smart-git.refresh', () => {
        gitService.updateRepositories();
    });

    const toggleFileCommand = vscode.commands.registerCommand('smart-git.toggleFile', async (item: FileTreeItem) => {
        if (item?.resourceUri && item?.repository) {
            await gitService.toggleFileSelection(item.resourceUri, item.repository.rootUri);
        }
    });

    const showFileDiffCommand = vscode.commands.registerCommand('smart-git.showFileDiff', async (item: FileTreeItem) => {
        if (item?.resourceUri && item?.repository) {
            await gitService.showFileDiff(item.resourceUri, item.repository);
        }
    });

    const openFileCommand = vscode.commands.registerCommand('smart-git.openFile', async (item: FileTreeItem) => {
        if (item?.resourceUri) {
            await vscode.window.showTextDocument(item.resourceUri);
        }
    });

    return [refreshCommand, toggleFileCommand, showFileDiffCommand, openFileCommand];
}

function registerMessageCommands(gitService: GitService): vscode.Disposable[] {
    const generateCommitMessageCommand = vscode.commands.registerCommand('smart-git.generateCommitMessage', async () => {
        const repos = gitService.getRepositories();
        if (repos.length === 0) {
            vscode.window.showErrorMessage('No Git repositories found.');
            return;
        }
        
        const activeRepo = repos[0];
        try {
            const generatedMessage = await gitService.generateCommitMessage(activeRepo);
            if (generatedMessage) {
                vscode.window.showInformationMessage(`Generated commit message: ${generatedMessage}`);
            } else {
                vscode.window.showWarningMessage('Could not generate commit message.');
            }
        } catch (error: unknown) {
            console.error('Failed to generate commit message:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to generate commit message: ${errorMessage}`);
        }
    });

    return [generateCommitMessageCommand];
}

function registerUtilityCommands(gitService: GitService): vscode.Disposable[] {
    const debugCommitSetupCommand = vscode.commands.registerCommand('smart-git.debugCommitSetup', async () => {
        try {
            const activeRepo = gitService.getRepositories()[0];
            if (!activeRepo) {
                vscode.window.showErrorMessage('No active repository found for debugging.');
                return;
            }
            
            const validation = await gitService.validateCommitSetup(activeRepo);
            
            if (validation.isValid) {
                vscode.window.showInformationMessage('✅ Commit setup is valid!');
            } else {
                const issues = validation.issues.join('\n');
                vscode.window.showWarningMessage(`⚠️ Commit setup issues:\n${issues}`);
            }
        } catch (error: unknown) {
            console.error('Debug commit setup failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Debug failed: ${errorMessage}`);
        }
    });

    const showGitTreeCommand = vscode.commands.registerCommand('smart-git.showGitTree', () => {
        vscode.window.showInformationMessage('Git Tree view is coming soon!');
    });

    const diagnosticsCommand = vscode.commands.registerCommand('smart-git.diagnostics', async () => {
        try {
            await showGitDiagnostics(gitService);
        } catch (error: unknown) {
            console.error('Diagnostics failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Diagnostics failed: ${errorMessage}`);
        }
    });

    return [debugCommitSetupCommand, showGitTreeCommand, diagnosticsCommand];
}

async function showGitDiagnostics(gitService: GitService): Promise<void> {
    const output = vscode.window.createOutputChannel('Smart Git Diagnostics');
    output.clear();
    output.show();

    output.appendLine('=== Smart Git Diagnostics ===');
    output.appendLine(`Timestamp: ${new Date().toISOString()}`);
    output.appendLine('');

    // Workspace information
    output.appendLine('--- Workspace Information ---');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        workspaceFolders.forEach((folder, index) => {
            output.appendLine(`Workspace ${index + 1}: ${folder.uri.fsPath}`);
        });
    } else {
        output.appendLine('No workspace folders found');
    }
    output.appendLine('');

    // Repository information
    output.appendLine('--- Repository Information ---');
    const repositories = gitService.getRepositories();
    output.appendLine(`Found ${repositories.length} repositories:`);
    
    if (repositories.length === 0) {
        output.appendLine('❌ No Git repositories found!');
        output.appendLine('Solutions:');
        output.appendLine('  • Make sure you have opened a Git repository in VS Code');
        output.appendLine('  • Run "git init" in your project folder if it\'s not a Git repo yet');
        output.appendLine('  • Check if the Git extension is enabled in VS Code');
    } else {
        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];
            output.appendLine(`Repository ${i + 1}:`);
            output.appendLine(`  Path: ${repo.rootUri.fsPath}`);
            output.appendLine(`  State: ${JSON.stringify(repo.state, null, 2)}`);
            
            try {
                const changedFiles = await gitService.getChangedFiles(repo);
                output.appendLine(`  Changed files: ${changedFiles.length}`);
                changedFiles.forEach(file => {
                    output.appendLine(`    - ${file.fsPath}`);
                });
                
                const selectedFiles = gitService.getSelectedFiles(repo.rootUri);
                output.appendLine(`  Selected files: ${selectedFiles.length}`);
                selectedFiles.forEach(file => {
                    output.appendLine(`    - ${file.fsPath}`);
                });
            } catch (error) {
                output.appendLine(`  ❌ Error getting file information: ${error}`);
            }
            output.appendLine('');
        }
    }

    output.appendLine('--- Extension Status ---');
    try {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension) {
            output.appendLine(`✅ VS Code Git extension found (version: ${gitExtension.packageJSON.version})`);
            output.appendLine(`   Active: ${gitExtension.isActive}`);
        } else {
            output.appendLine('❌ VS Code Git extension not found!');
        }
    } catch (error) {
        output.appendLine(`❌ Error checking Git extension: ${error}`);
    }

    output.appendLine('');
    output.appendLine('=== End Diagnostics ===');
    
    vscode.window.showInformationMessage('Git diagnostics complete! Check the output panel for details.');
}
