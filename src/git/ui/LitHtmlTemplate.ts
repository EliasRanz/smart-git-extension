import { html, TemplateResult } from 'lit-html';
import * as vscode from 'vscode';

/**
 * Modern HTML templating using lit-html for VS Code webviews.
 * This replaces our custom HtmlTemplateBuilder with a proven, lightweight solution.
 */
export class LitHtmlTemplate {
    /**
     * Creates the complete HTML document for the Smart Git Commit panel.
     */
    public static createCommitPanelHtml(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        nonce: string
    ): string {
        const { scriptUri, styleResetUri, styleVSCodeUri } = this.getWebviewResources(webview, extensionUri);
        
        const template = this.createCommitPanelTemplate();
        
        return this.buildDocument({
            title: 'Smart Git Commit',
            cspSource: webview.cspSource,
            nonce,
            styles: [styleResetUri.toString(), styleVSCodeUri.toString()],
            scripts: [scriptUri.toString()],
            bodyContent: template
        });
    }

    /**
     * Creates the main commit panel template using lit-html.
     */
    private static createCommitPanelTemplate(): TemplateResult {
        return html`
            <div class="main-container">
                <header class="panel-header">
                    <h1 class="panel-title">Smart Git Commit</h1>
                </header>
                
                <section class="message-section">
                    <div class="textarea-container">
                        <label for="commitMessage" class="textarea-label">Commit Message</label>
                        <textarea 
                            id="commitMessage" 
                            class="commit-textarea" 
                            placeholder="Enter commit message or generate one..." 
                            rows="4">
                        </textarea>
                    </div>
                    <button id="generateButton" type="button" class="ai-generate-btn">
                        <span class="ai-icon">✨</span>
                        <span class="ai-text">Generate AI Message</span>
                        <span class="ai-loading" style="display: none;">⟳</span>
                    </button>
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
                
                <div id="statusMessage" class="status-message"></div>
            </div>
        `;
    }

    /**
     * Builds the complete HTML document structure.
     */
    private static buildDocument(config: {
        title: string;
        cspSource: string;
        nonce: string;
        styles: string[];
        scripts: string[];
        bodyContent: TemplateResult;
    }): string {
        const { title, cspSource, nonce, styles, scripts, bodyContent } = config;
        
        const csp = `default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';`;
        const styleLinks = styles.map(style => `<link href="${style}" rel="stylesheet">`).join('\n    ');
        const scriptTags = scripts.map(script => `<script nonce="${nonce}" src="${script}"></script>`).join('\n    ');
        
        // Convert lit-html template to string
        const bodyHtml = this.templateToString(bodyContent);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${styleLinks}
    <title>${title}</title>
</head>
<body>
    ${bodyHtml}
    ${scriptTags}
</body>
</html>`;
    }

    /**
     * Converts lit-html TemplateResult to string.
     * In a real-world scenario, you might want to use a server-side rendering solution.
     * For VS Code webviews, this simple approach works well.
     */
    private static templateToString(template: TemplateResult): string {
        // For VS Code webviews, we can use the template's strings and values
        let result = '';
        const { strings, values } = template;
        
        for (let i = 0; i < strings.length; i++) {
            result += strings[i];
            if (i < values.length) {
                const value = values[i];
                if (value != null) {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        result += String(value);
                    } else {
                        // For complex objects, convert to JSON or handle appropriately
                        result += JSON.stringify(value);
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * Gets webview resource URIs.
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
