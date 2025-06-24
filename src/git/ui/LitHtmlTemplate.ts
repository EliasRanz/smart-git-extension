import { html, TemplateResult } from 'lit-html';
import * as vscode from 'vscode';

/**
 * Modern HTML templating using lit-html for VS Code webviews.
 * This replaces our custom HtmlTemplateBuilder with a proven, lightweight solution.
 */
export class LitHtmlTemplate {
    /**
     * Creates the complete HTML document for the commit panel.
     */
    public static createCommitPanelHtml(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        nonce: string
    ): string {
        const { scriptUri, styleResetUri, styleVSCodeUri } = this.getWebviewResources(webview, extensionUri);
        const htmlContent = `${this.getCompactStyles()}${this.getCommitPanelBody()}`;
        
        return this.buildDocument({
            title: 'Smart Git',
            cspSource: webview.cspSource,
            nonce,
            styles: [styleResetUri.toString(), styleVSCodeUri.toString()],
            scripts: [scriptUri.toString()],
            bodyContent: htmlContent
        });
    }

    /**
     * Gets the main body content for the commit panel.
     */
    private static getCommitPanelBody(): string {
        return `
            <div class="main-container">
                <section class="message-section">
                    <div class="message-container">
                        <label for="commitMessage">Commit Message</label>
                        <textarea 
                            id="commitMessage" 
                            class="commit-textarea" 
                            placeholder="Enter commit message or generate one..." 
                            rows="4">
                        </textarea>
                        <button id="generateButton" type="button" class="ai-button">
                            <span class="ai-icon">✨</span>
                            <span class="ai-text">Generate with AI</span>
                            <span class="ai-loading" style="display: none;">⟳</span>
                        </button>
                    </div>
                </section>
                
                <section class="options-section">
                    <label class="checkbox-label">
                        <input type="checkbox" id="amendCheckbox">
                        <span> Amend last commit</span>
                    </label>
                </section>
                
                <section class="actions-section">
                    <button id="commitButton" type="button" class="btn btn-primary">
                        Commit
                    </button>
                    <button id="commitPushButton" type="button" class="btn btn-secondary">
                        Commit & Push
                    </button>
                </section>
                
                <div id="statusMessage" class="status-message" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Gets the compact embedded styles for the commit panel.
     */
    private static getCompactStyles(): string {
        return `
            <style>
                ${this.getContainerStyles()}
                ${this.getFormStyles()}
                ${this.getButtonStyles()}
            </style>
        `;
    }

    /**
     * Gets container and layout styles.
     */
    private static getContainerStyles(): string {
        return `
                .main-container {
                    padding: 8px;
                    max-width: 600px;
                    margin: 0 auto;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
                
                .message-section, .options-section, .actions-section {
                    margin-bottom: 8px;
                    padding: 12px;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                }
                
                .actions-section {
                    display: flex !important;
                    flex-direction: row;
                    gap: 8px;
                    align-items: center;
                    min-height: 40px;
                    padding: 8px;
                }
                
                .message-container {
                    position: relative;
                }
        `;
    }

    /**
     * Gets form input and control styles.
     */
    private static getFormStyles(): string {
        return `
                .commit-textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 8px;
                    border: 2px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    line-height: 1.4;
                    border-radius: 4px;
                    resize: vertical;
                    box-sizing: border-box;
                }
                
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                    font-size: 13px;
                    color: var(--vscode-foreground);
                }
        `;
    }

    /**
     * Gets button and interactive element styles.
     */
    private static getButtonStyles(): string {
        return `
                .btn {
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                    font-weight: 500;
                    display: inline-block;
                    margin-right: 8px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .btn-primary {
                    background-color: #007ACC;
                    color: white;
                }
                
                .btn-secondary {
                    background-color: #5A5A5A;
                    color: white;
                }
                
                .btn:hover {
                    opacity: 0.8;
                }
                
                .ai-button {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: 1px solid var(--vscode-button-border);
                    padding: 3px 6px;
                    font-size: 11px;
                    cursor: pointer;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }
        `;
    }

    /**
     * Creates the main commit panel template using lit-html.
     */
    private static createCommitPanelTemplate(): TemplateResult {
        return html`
            <div class="main-container">
                <section class="message-section">
                    <div class="message-container">
                        <label for="commitMessage" class="textarea-label">Commit Message</label>
                        <textarea 
                            id="commitMessage" 
                            class="commit-textarea" 
                            placeholder="Enter commit message or generate one..." 
                            rows="4">
                        </textarea>
                        <button id="generateButton" type="button" class="ai-button">
                            <span class="ai-icon">✨</span>
                            <span class="ai-text">Generate with AI</span>
                            <span class="ai-loading" style="display: none;">⟳</span>
                        </button>
                    </div>
                </section>
                
                <section class="options-section">
                    <label class="checkbox-label">
                        <input type="checkbox" id="amendCheckbox">
                        <span> Amend last commit</span>
                    </label>
                </section>
                
                <section class="actions-section">
                    <button id="commitButton" type="button" class="btn btn-primary">
                        Commit
                    </button>
                    <button id="commitPushButton" type="button" class="btn btn-secondary">
                        Commit & Push
                    </button>
                </section>
                
                <div id="statusMessage" class="status-message" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Builds an HTML document with the specified content and resources.
     */
    private static buildDocument(config: {
        title: string;
        cspSource: string;
        nonce: string;
        styles: string[];
        scripts: string[];
        bodyContent: string;
    }): string {
        const { title, cspSource, nonce, styles, scripts, bodyContent } = config;
        
        const styleLinks = styles.map(href => `<link href="${href}" rel="stylesheet">`).join('\n');
        const scriptTags = scripts.map(src => `<script nonce="${nonce}" src="${src}"></script>`).join('\n');
        
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>${title}</title>
    ${styleLinks}
</head>
<body>
    ${bodyContent}
    ${scriptTags}
</body>
</html>`;
    }

    /**
     * Gets webview URIs for required resources.
     */
    private static getWebviewResources(
        webview: vscode.Webview, 
        extensionUri: vscode.Uri
    ): {
        scriptUri: vscode.Uri;
        styleResetUri: vscode.Uri;
        styleVSCodeUri: vscode.Uri;
    } {
        return {
            scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js')),
            styleResetUri: webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'reset.css')),
            styleVSCodeUri: webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css'))
        };
    }
}

/**
 * Generates a nonce for CSP security.
 */
export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
