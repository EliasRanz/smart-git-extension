import * as vscode from 'vscode';
import { GitService } from '../GitService';
import { Repository } from '../git.d';
import { HtmlTemplateBuilder, HtmlTemplateConfig, HtmlElement } from './HtmlTemplateBuilder';

interface WebviewMessage {
    type: string;
    message?: string;
    amend?: boolean;
}

export class CommitPanelProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'smart-git-view.commit-panel';

    private _view?: vscode.WebviewView;

    public constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _gitService: GitService
    ) { }

    /**
     * Resolves the webview view for the commit panel.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._view = webviewView;
        this.setupWebviewOptions(webviewView);
        this.setupWebviewContent(webviewView);
        this.setupMessageHandler(webviewView);
    }

    /**
     * Sets up webview options for security and resource access.
     */
    private setupWebviewOptions(webviewView: vscode.WebviewView): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
    }

    /**
     * Sets up the HTML content for the webview.
     */
    private setupWebviewContent(webviewView: vscode.WebviewView): void {
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    /**
     * Sets up the message handler for webview communication.
     */
    private setupMessageHandler(webviewView: vscode.WebviewView): void {
        webviewView.webview.onDidReceiveMessage(async data => {
            await this.handleWebviewMessage(webviewView, data);
        });
    }

    /**
     * Handles messages received from the webview.
     */
    private async handleWebviewMessage(webviewView: vscode.WebviewView, data: WebviewMessage): Promise<void> {
        console.log('Received message from webview:', data);
        
        const activeRepo = this.getActiveRepository();
        if (!activeRepo) {
            return;
        }

        switch (data.type) {
            case 'commit':
                await this.handleCommit(activeRepo, data);
                break;
            case 'commitAndPush':
                await this.handleCommitAndPush(activeRepo, data);
                break;
            case 'generateCommitMessage':
                await this.handleGenerateCommitMessage(webviewView, activeRepo);
                break;
        }
    }

    /**
     * Gets the active repository for operations.
     */
    private getActiveRepository(): Repository | null {
        const activeRepo = this._gitService.getRepositories()[0];
        
        if (!activeRepo) {
            vscode.window.showErrorMessage("No active repository found.");
            console.error('No active repository found. Available repos:', this._gitService.getRepositories());
            return null;
        }

        this.logRepositoryInfo(activeRepo);
        return activeRepo;
    }

    /**
     * Logs repository information for debugging.
     */
    private logRepositoryInfo(activeRepo: Repository): void {
        console.log('Active repositories:', this._gitService.getRepositories().length);
        console.log('Active repo details:', {
            rootUri: activeRepo.rootUri.fsPath,
            state: !!activeRepo.state,
            headName: activeRepo.state?.HEAD?.name
        });
    }

    /**
     * Handles commit operations.
     */
    private async handleCommit(activeRepo: Repository, data: WebviewMessage): Promise<void> {
        try {
            await this._gitService.commit(activeRepo, data.message ?? '', data.amend ?? false);
        } catch (error: unknown) {
            console.error('Commit failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Commit failed: ${errorMessage}`);
        }
    }

    /**
     * Handles commit and push operations.
     */
    private async handleCommitAndPush(activeRepo: Repository, data: WebviewMessage): Promise<void> {
        try {
            await this._gitService.commitAndPush(activeRepo, data.message ?? '', data.amend ?? false);
        } catch (error: unknown) {
            console.error('Commit and push failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Commit and push failed: ${errorMessage}`);
        }
    }

    /**
     * Handles commit message generation requests.
     */
    private async handleGenerateCommitMessage(webviewView: vscode.WebviewView, activeRepo: Repository): Promise<void> {
        try {
            this.showGeneratingState(webviewView, true);
            const generatedMessage = await this._gitService.generateCommitMessage(activeRepo);
            this.sendGeneratedMessage(webviewView, generatedMessage);
        } catch (error: unknown) {
            console.error('Generate commit message failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Generate commit message failed: ${errorMessage}`);
            this.sendGeneratedMessage(webviewView, undefined, errorMessage);
        } finally {
            this.showGeneratingState(webviewView, false);
        }
    }

    /**
     * Shows or hides the generating state in the webview.
     */
    private showGeneratingState(webviewView: vscode.WebviewView, isGenerating: boolean): void {
        webviewView.webview.postMessage({
            type: 'generatingCommitMessage',
            isGenerating
        });
    }

    /**
     * Sends the generated commit message to the webview.
     */
    private sendGeneratedMessage(webviewView: vscode.WebviewView, message: string | undefined, error?: string): void {
        webviewView.webview.postMessage({
            type: 'commitMessageGenerated',
            message,
            error,
            isGenerating: false
        });
    }

    /**
     * Generates the HTML content for the webview.
     * 
     * Alternative approach using AdvancedTemplateBuilder:
     * 
     * ```typescript
     * private async _getHtmlForWebviewAlt(webview: vscode.Webview): Promise<string> {
     *     const templateData = AdvancedTemplateBuilder.createWebviewConfig(
     *         webview, this._extensionUri, 'Smart Git Commit'
     *     );
     *     return AdvancedTemplateBuilder.loadTemplate(this._extensionUri, 'commit-panel', templateData);
     * }
     * ```
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const { scriptUri, styleResetUri, styleVSCodeUri } = this.getWebviewResources(webview);
        const nonce = getNonce();

        const config: HtmlTemplateConfig = {
            title: 'Smart Git Commit',
            cspSource: webview.cspSource,
            nonce,
            styles: [styleResetUri.toString(), styleVSCodeUri.toString()],
            scripts: [scriptUri.toString()]
        };

        const elements = this.createCommitPanelElements();
        return HtmlTemplateBuilder.buildDocument(config, elements);
    }

    /**
     * Creates the UI elements for the commit panel.
     */
    private createCommitPanelElements(): HtmlElement[] {
        const el = HtmlTemplateBuilder.createElements();
        
        return [
            el.heading('Smart Git Commit'),
            el.textarea('commitMessage', 'Enter commit message or generate one...', 4),
            el.buttonGroup([
                el.button('generateButton', 'Generate AI Message'),
                el.checkbox('amendCheckbox', 'Amend last commit')
            ]),
            el.buttonGroup([
                el.button('commitButton', 'Commit'),
                el.button('commitPushButton', 'Commit & Push')
            ]),
            el.statusDiv()
        ];
    }

    /**
     * Gets webview resource URIs.
     */
    private getWebviewResources(webview: vscode.Webview): {
        scriptUri: vscode.Uri;
        styleResetUri: vscode.Uri;
        styleVSCodeUri: vscode.Uri;
    } {
        return {
            scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')),
            styleResetUri: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')),
            styleVSCodeUri: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'))
        };
    }
}

/**
 * Generates a nonce for CSP security.
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
