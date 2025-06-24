import * as vscode from 'vscode';
import { SimpleGit } from 'simple-git';
import { Repository } from '../git.d';
import { GitDiffService } from './GitDiffService';

/**
 * File change in repository state.
 */
interface Change {
    uri: vscode.Uri;
    status?: number;
}

/**
 * File change analysis result for AI commit message generation.
 */
export interface FileChangeAnalysis {
    fileName: string;
    changeType: string;
    diff: string;
    summary: string;
}

/**
 * Service responsible for generating AI-powered commit messages.
 */
export class CommitMessageGenerator {
    private readonly _simpleGitInstances: Map<string, SimpleGit>;
    private readonly _diffService: GitDiffService;

    public constructor(simpleGitInstances: Map<string, SimpleGit>, diffService: GitDiffService) {
        this._simpleGitInstances = simpleGitInstances;
        this._diffService = diffService;
    }

    /**
     * Generates an AI-powered commit message based on selected files.
     * @param repository The git repository
     * @param selectedFiles The selected files for commit
     * @returns Generated commit message or undefined if failed
     */
    public async generateCommitMessage(
        repository: Repository, 
        selectedFiles: vscode.Uri[]
    ): Promise<string | undefined> {
        try {
            if (selectedFiles.length === 0) {
                throw new Error('No files selected for commit message generation');
            }

            console.log(`Generating commit message for ${selectedFiles.length} files...`);
            
            // Analyze all selected files
            const diffsAndContext = await this.getSelectedFilesDiffs(repository, selectedFiles);
            
            if (diffsAndContext.length === 0) {
                throw new Error('No analyzable changes found in selected files');
            }

            // Create the detailed prompt for AI
            const prompt = this.createDetailedCommitPrompt(diffsAndContext);
            console.log('Generated AI prompt:', prompt.substring(0, 500) + '...');

            // Try to get AI-generated message
            const aiMessage = await this.requestAICommitMessage(prompt);
            
            if (aiMessage) {
                console.log('AI-generated commit message:', aiMessage);
                return aiMessage;
            } else {
                // Fallback to rule-based generation
                console.log('AI generation failed, using rule-based fallback');
                return this.generateRuleBasedCommitMessage(prompt);
            }
        } catch (error: unknown) {
            console.error('Failed to generate commit message:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to generate commit message: ${errorMessage}`);
            return undefined;
        }
    }

    /**
     * Gets diff analysis for all selected files.
     */
    private async getSelectedFilesDiffs(
        repository: Repository, 
        selectedFiles: vscode.Uri[]
    ): Promise<FileChangeAnalysis[]> {
        const diffsAndContext: FileChangeAnalysis[] = [];
        
        for (const fileUri of selectedFiles) {
            try {
                const fileAnalysis = await this.analyzeFileChange(repository, fileUri);
                if (fileAnalysis) {
                    diffsAndContext.push(fileAnalysis);
                }
            } catch (error) {
                console.warn(`Failed to analyze file ${fileUri.fsPath}:`, error);
            }
        }
        
        return diffsAndContext;
    }

    /**
     * Analyzes a single file change.
     */
    private async analyzeFileChange(
        repository: Repository, 
        fileUri: vscode.Uri
    ): Promise<FileChangeAnalysis | undefined> {
        const fileName = fileUri.fsPath.split('/').pop() ?? 'unknown';
        const relativePath = vscode.workspace.asRelativePath(fileUri);
        
        // Determine change type and get diff
        const changeInfo = this.getFileChangeInfo(repository, fileUri);
        if (!changeInfo) {
            return undefined;
        }

        const { changeType } = changeInfo;
        const diff = await this._diffService.getFileDiff(repository, fileUri, relativePath, changeType);
        const summary = this.createChangeSummary(fileName, changeType);
        
        return {
            fileName,
            changeType,
            diff: diff.substring(0, 1500), // Limit diff size for AI
            summary
        };
    }

    /**
     * Gets file change information from repository state.
     */
    private getFileChangeInfo(repository: Repository, fileUri: vscode.Uri): {changeType: string, change: Change} | undefined {
        const stagedChange = repository.state.indexChanges.find(change => change.uri.fsPath === fileUri.fsPath);
        const workingTreeChange = repository.state.workingTreeChanges.find(change => change.uri.fsPath === fileUri.fsPath);
        const untrackedChange = repository.state.untrackedChanges.find(change => change.uri.fsPath === fileUri.fsPath);
        
        if (untrackedChange) {
            return { changeType: 'A', change: untrackedChange };
        } else if (stagedChange) {
            return { changeType: this.getChangeTypeLabel(stagedChange.status ?? 0), change: stagedChange };
        } else if (workingTreeChange) {
            return { changeType: this.getChangeTypeLabel(workingTreeChange.status ?? 0), change: workingTreeChange };
        }
        
        return undefined;
    }

    /**
     * Creates a human-readable summary of file changes.
     */
    private createChangeSummary(fileName: string, changeType: string): string {
        switch (changeType) {
            case 'A': return `Added new file: ${fileName}`;
            case 'D': return `Deleted file: ${fileName}`;
            case 'R': return `Renamed file: ${fileName}`;
            case 'M': return `Modified file: ${fileName}`;
            default: return `Changed file: ${fileName}`;
        }
    }

    /**
     * Creates a detailed prompt for AI commit message generation.
     */
    private createDetailedCommitPrompt(diffsAndContext: FileChangeAnalysis[]): string {
        const filesSummary = diffsAndContext.map(item => `- ${item.summary}`).join('\n');
        const detailedChanges = diffsAndContext.map(item => 
            `File: ${item.fileName}\nChange Type: ${item.changeType}\nDiff:\n${item.diff}`
        ).join('\n\n---\n\n');

        return `Generate a concise, professional Git commit message following conventional commit format.

Files changed:
${filesSummary}

Detailed changes:
${detailedChanges}

Please generate a commit message that:
1. Uses conventional commit format (feat:, fix:, docs:, style:, refactor:, test:, chore:)
2. Is concise but descriptive (50-72 characters for the title)
3. Captures the main purpose of these changes
4. Uses present tense (e.g., "add feature" not "added feature")

Return only the commit message, no additional text.`;
    }

    /**
     * Requests AI commit message from various providers.
     */
    private async requestAICommitMessage(prompt: string): Promise<string | undefined> {
        // Try GitHub Copilot Chat first
        const copilotMessage = await this.tryGitHubCopilotChat(prompt);
        if (copilotMessage) {
            return copilotMessage;
        }

        // Try intelligent generation as fallback
        return this.generateIntelligentCommitMessage(prompt);
    }

    /**
     * Tries to use GitHub Copilot Chat for commit message generation.
     */
    private async tryGitHubCopilotChat(prompt: string): Promise<string | undefined> {
        try {
            // Check if GitHub Copilot Chat extension is available
            const copilotExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
            if (!copilotExtension?.isActive) {
                console.log('GitHub Copilot Chat not available');
                return undefined;
            }

            // Use VS Code's built-in AI chat command if available
            const result = await vscode.commands.executeCommand(
                'github.copilot.interactiveEditor.generateCommitMessage',
                { prompt }
            );

            if (typeof result === 'string' && result.trim()) {
                return this.cleanupAIResponse(result);
            }
        } catch (error) {
            console.log('GitHub Copilot Chat failed:', error);
        }
        return undefined;
    }

    /**
     * Generates an intelligent commit message using pattern matching.
     */
    private generateIntelligentCommitMessage(prompt: string): Promise<string | undefined> {
        try {
            const commitType = this.determineCommitType(prompt);
            const scope = this.determineScope(prompt);
            const description = this.generateDescription(prompt, commitType);
            
            const scopePart = scope ? `(${scope})` : '';
            return Promise.resolve(`${commitType}${scopePart}: ${description}`);
        } catch (error) {
            console.error('Intelligent generation failed:', error);
            return Promise.resolve(undefined);
        }
    }

    /**
     * Determines the commit type based on prompt analysis.
     */
    private determineCommitType(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        
        const typeMap = {
            fix: ['fix', 'bug', 'error'],
            test: ['test', 'spec'],
            docs: ['doc', 'readme', '.md'],
            refactor: ['refactor', 'restructure'],
            style: ['style', 'format'],
            chore: ['delete', 'remove']
        };

        for (const [type, keywords] of Object.entries(typeMap)) {
            if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
                return type;
            }
        }

        return 'feat';
    }

    /**
     * Determines the scope based on file analysis.
     */
    private determineScope(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        
        const scopeMap = {
            deps: ['package.json'],
            test: ['test', 'spec'],
            docs: ['doc', 'readme'],
            config: ['config', '.json', '.yml'],
            ui: ['ui', 'component'],
            api: ['api', 'service']
        };

        for (const [scope, keywords] of Object.entries(scopeMap)) {
            if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
                return scope;
            }
        }
        
        return '';
    }

    /**
     * Generates a description based on the prompt and commit type.
     */
    private generateDescription(prompt: string, commitType: string): string {
        const lowerPrompt = prompt.toLowerCase();
        
        const descriptions = this.getDescriptionMap();
        const typeDescriptions = descriptions[commitType];
        
        if (typeDescriptions) {
            for (const [keyword, description] of Object.entries(typeDescriptions)) {
                if (lowerPrompt.includes(keyword)) {
                    return description;
                }
            }
        }
        
        return this.getDefaultDescription(commitType);
    }

    /**
     * Gets description mapping for different commit types and keywords.
     */
    private getDescriptionMap(): { [key: string]: { [key: string]: string } } {
        return {
            fix: {
                bug: 'resolve critical bug',
                error: 'handle error cases'
            },
            feat: {
                add: 'add new feature',
                implement: 'implement functionality'  
            }
        };
    }

    /**
     * Gets default description for a commit type.
     */
    private getDefaultDescription(commitType: string): string {
        const defaults: { [key: string]: string } = {
            'feat': 'add new functionality',
            'fix': 'resolve issues',
            'docs': 'update documentation',
            'style': 'format code',
            'refactor': 'improve structure',
            'test': 'add tests',
            'chore': 'update tasks'
        };
        return defaults[commitType] ?? 'update codebase';
    }

    /**
     * Generates a rule-based commit message as fallback.
     */
    private generateRuleBasedCommitMessage(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();
        
        const rules = [
            { keywords: ['added', 'new'], message: 'feat: add new functionality' },
            { keywords: ['deleted', 'removed'], message: 'chore: remove unused files' },
            { keywords: ['test', 'spec'], message: 'test: add or update tests' },
            { keywords: ['readme', 'documentation', '.md'], message: 'docs: update documentation' },
            { keywords: ['package.json', 'dependencies'], message: 'chore: update dependencies' },
            { keywords: ['fix', 'bug', 'error'], message: 'fix: resolve issues' },
            { keywords: ['refactor', 'restructure'], message: 'refactor: improve code structure' },
            { keywords: ['style', 'format'], message: 'style: format code' }
        ];

        for (const rule of rules) {
            if (rule.keywords.some(keyword => lowerPrompt.includes(keyword))) {
                return rule.message;
            }
        }

        return 'feat: update codebase';
    }

    /**
     * Cleans up AI response to ensure it's a proper commit message.
     */
    private cleanupAIResponse(response: string): string {
        // Remove common prefixes and cleanup
        let cleaned = response.trim();
        
        // Remove quotes if present
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1);
        }
        
        // Remove "Commit message:" prefix if present
        cleaned = cleaned.replace(/^(commit\s+message:\s*)/i, '');
        
        // Ensure first line doesn't exceed 72 characters
        const lines = cleaned.split('\n');
        if (lines[0].length > 72) {
            lines[0] = lines[0].substring(0, 69) + '...';
        }
        
        return lines.join('\n').trim();
    }

    /**
     * Converts VS Code change status to change type label.
     */
    private getChangeTypeLabel(status: number): string {
        // VS Code Git status constants
        switch (status) {
            case 0: return 'U'; // Untracked
            case 1: return 'A'; // Added
            case 2: return 'M'; // Modified  
            case 3: return 'D'; // Deleted
            case 4: return 'R'; // Renamed
            case 5: return 'C'; // Copied
            case 6: return 'U'; // Unmerged
            default: return 'M'; // Default to Modified
        }
    }
}
