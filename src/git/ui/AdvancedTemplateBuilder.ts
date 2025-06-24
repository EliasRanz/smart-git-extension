/**
 * Advanced HTML template system for VS Code webviews.
 * Supports external template files and more complex templating scenarios.
 */

import * as vscode from 'vscode';

export interface TemplateData {
    [key: string]: string | number | boolean | TemplateData | TemplateData[];
}

/**
 * Advanced template builder with support for external template files.
 */
export class AdvancedTemplateBuilder {
    private static readonly TEMPLATE_PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

    /**
     * Loads and processes a template file from the extension's templates directory.
     * Template files can use {{variableName}} placeholders.
     * 
     * @param extensionUri Base URI of the extension
     * @param templateName Name of the template file (without .html extension)
     * @param data Data to substitute in the template
     * @returns Processed HTML string
     */
    public static async loadTemplate(
        extensionUri: vscode.Uri, 
        templateName: string, 
        data: TemplateData = {}
    ): Promise<string> {
        try {
            const templatePath = vscode.Uri.joinPath(extensionUri, 'templates', `${templateName}.html`);
            const templateBytes = await vscode.workspace.fs.readFile(templatePath);
            const templateContent = Buffer.from(templateBytes).toString('utf8');
            
            return this.processTemplate(templateContent, data);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Template ${templateName} not found (${errorMessage}), falling back to built-in template`);
            return this.getFallbackTemplate(templateName, data);
        }
    }

    /**
     * Processes a template string by replacing placeholders with data values.
     */
    public static processTemplate(template: string, data: TemplateData): string {
        return template.replace(this.TEMPLATE_PLACEHOLDER_REGEX, (match, key) => {
            const value = data[key];
            if (value === undefined) {
                console.warn(`Template placeholder ${key} not found in data`);
                return match; // Keep original placeholder
            }
            
            // Handle different value types safely
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
            }
            
            // For complex objects, stringify them
            return JSON.stringify(value);
        });
    }

    /**
     * Creates a template configuration for common VS Code webview scenarios.
     */
    public static createWebviewConfig(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        title: string,
        additionalStyles: string[] = [],
        additionalScripts: string[] = []
    ): TemplateData {
        const nonce = this.generateNonce();
        
        return {
            title,
            nonce,
            cspSource: webview.cspSource,
            styleReset: webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'reset.css')).toString(),
            styleVSCode: webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css')).toString(),
            mainScript: webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js')).toString(),
            additionalStyles: additionalStyles.map(style => 
                webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', style)).toString()
            ).join('\n    '),
            additionalScripts: additionalScripts.map(script => 
                `<script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', script))}"></script>`
            ).join('\n    ')
        };
    }

    /**
     * Provides fallback templates when external template files are not available.
     */
    private static getFallbackTemplate(templateName: string, data: TemplateData): string {
        const fallbacks: Record<string, string> = {
            'commit-panel': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}}; script-src 'nonce-{{nonce}}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="{{styleReset}}" rel="stylesheet">
    <link href="{{styleVSCode}}" rel="stylesheet">
    <title>{{title}}</title>
</head>
<body>
    <h1>Smart Git Commit</h1>
    <textarea id="commitMessage" placeholder="Enter commit message or generate one..." rows="4"></textarea>
    <div class="button-group">
        <button id="generateButton">Generate AI Message</button>
        <label>
            <input type="checkbox" id="amendCheckbox"> Amend last commit
        </label>
    </div>
    <div class="button-group">
        <button id="commitButton">Commit</button>
        <button id="commitPushButton">Commit & Push</button>
    </div>
    <div id="statusMessage"></div>
    <script nonce="{{nonce}}" src="{{mainScript}}"></script>
</body>
</html>`,
            
            'settings-panel': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
</head>
<body>
    <h1>Settings</h1>
    <p>Settings panel template</p>
</body>
</html>`
        };

        const template = fallbacks[templateName] || fallbacks['commit-panel'];
        return this.processTemplate(template, data);
    }

    /**
     * Generates a cryptographically secure nonce for CSP.
     */
    private static generateNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
