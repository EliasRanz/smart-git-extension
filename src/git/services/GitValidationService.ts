import * as vscode from 'vscode';
import { Repository } from '../git.d';

/**
 * Service responsible for validating git operations and repository state.
 */
export class GitValidationService {
    /**
     * Validates the commit setup for a repository.
     * @param repository The git repository
     * @param selectedFiles The selected files for commit
     * @param changedFiles All changed files in the repository
     * @returns Validation result with any issues found
     */
    public async validateCommitSetup(
        repository: Repository,
        selectedFiles: vscode.Uri[],
        changedFiles: vscode.Uri[]
    ): Promise<{isValid: boolean, issues: string[]}> {
        const issues: string[] = [];
        
        try {
            // Check if repository is valid
            if (!repository) {
                issues.push('No repository provided');
                return { isValid: false, issues };
            }
            
            if (!repository.rootUri) {
                issues.push('Repository has no root URI');
                return { isValid: false, issues };
            }
            
            // Check if repository has required methods
            if (typeof repository.add !== 'function') {
                issues.push('Repository.add method not available');
            }
            
            if (typeof repository.commit !== 'function') {
                issues.push('Repository.commit method not available');
            }
            
            // Check if there are selected files
            if (selectedFiles.length === 0) {
                issues.push('No files selected for commit');
            }
            
            // Check if selected files actually exist and have changes
            const validSelectedFiles = selectedFiles.filter(selected => 
                changedFiles.some(changed => changed.fsPath === selected.fsPath)
            );
            
            if (validSelectedFiles.length === 0) {
                issues.push('Selected files have no changes');
            }
            
            // Check repository state
            if (!repository.state) {
                issues.push('Repository state is not available');
            }
            
            this.logValidationResults(repository, selectedFiles, validSelectedFiles, changedFiles, issues);
            
            return { isValid: issues.length === 0, issues };
            
        } catch (error: unknown) {
            console.error('Error validating commit setup:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            issues.push(`Validation error: ${errorMessage}`);
            return { isValid: false, issues };
        }
    }

    /**
     * Logs validation results for debugging purposes.
     */
    private logValidationResults(
        repository: Repository,
        selectedFiles: vscode.Uri[],
        validSelectedFiles: vscode.Uri[],
        changedFiles: vscode.Uri[],
        issues: string[]
    ): void {
        console.log('Commit setup validation:');
        console.log('- Repository:', repository.rootUri.fsPath);
        console.log('- Repository methods available:', {
            add: typeof repository.add === 'function',
            commit: typeof repository.commit === 'function'
        });
        console.log('- Selected files:', selectedFiles.length);
        console.log('- Valid selected files:', validSelectedFiles.length);
        console.log('- Changed files total:', changedFiles.length);
        console.log('- Issues:', issues);
    }

    /**
     * Validates a commit message according to conventional commit standards.
     * @param message The commit message to validate
     * @returns Validation result
     */
    public validateCommitMessage(message: string): {isValid: boolean, issues: string[]} {
        const issues: string[] = [];
        
        if (!message || message.trim().length === 0) {
            issues.push('Commit message cannot be empty');
            return { isValid: false, issues };
        }
        
        const trimmedMessage = message.trim();
        
        // Check minimum length
        if (trimmedMessage.length < 10) {
            issues.push('Commit message should be at least 10 characters long');
        }
        
        // Check maximum length for first line
        const firstLine = trimmedMessage.split('\n')[0];
        if (firstLine.length > 72) {
            issues.push('First line should not exceed 72 characters');
        }
        
        // Check conventional commit format (optional but recommended)
        const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/;
        if (!conventionalCommitPattern.test(firstLine)) {
            // This is a warning, not an error
            console.log('Note: Consider using conventional commit format (feat:, fix:, docs:, etc.)');
        }
        
        return { isValid: issues.length === 0, issues };
    }
}
