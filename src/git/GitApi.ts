import * as vscode from 'vscode';
import { GitExtension, API as GitAPI } from './git.d';

export async function getGitApi(): Promise<GitAPI | undefined> {
    try {
        const extension = vscode.extensions.getExtension<GitExtension>('vscode.git');
        if (!extension) {
            return undefined;
        }

        if (!extension.isActive) {
            await extension.activate();
        }

        return extension.exports.getAPI(1);
    } catch (error) {
        console.error("Failed to get Git API:", error);
        return undefined;
    }
}
