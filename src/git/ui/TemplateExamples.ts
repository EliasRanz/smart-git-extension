/**
 * Example showing how to use the HtmlTemplateBuilder for different UI components.
 * This demonstrates the flexibility and reusability of the template system.
 */

import { HtmlTemplateBuilder, HtmlTemplateConfig } from './HtmlTemplateBuilder';

/**
 * Example: Settings panel template
 */
export function createSettingsPanel(webviewCspSource: string, nonce: string): string {
    const config: HtmlTemplateConfig = {
        title: 'Smart Git Settings',
        cspSource: webviewCspSource,
        nonce,
        styles: ['styles/settings.css'],
        scripts: ['scripts/settings.js']
    };

    const el = HtmlTemplateBuilder.createElements();
    
    const elements = [
        el.heading('Smart Git Settings'),
        
        // AI Settings Section
        el.heading('AI Configuration', 2),
        el.buttonGroup([
            { 
                tag: 'label', 
                content: 'AI Provider:',
                children: [
                    { 
                        tag: 'select', 
                        attributes: { id: 'aiProvider' },
                        children: [
                            { tag: 'option', attributes: { value: 'openai' }, content: 'OpenAI' },
                            { tag: 'option', attributes: { value: 'anthropic' }, content: 'Anthropic' },
                            { tag: 'option', attributes: { value: 'local' }, content: 'Local Model' }
                        ]
                    }
                ]
            }
        ]),
        
        // Commit Message Settings
        el.heading('Commit Message Settings', 2),
        el.checkbox('useConventionalCommits', 'Use Conventional Commits format'),
        el.checkbox('includeScope', 'Include scope in commit messages'),
        
        // Action Buttons
        el.buttonGroup([
            el.button('saveSettings', 'Save Settings'),
            el.button('resetSettings', 'Reset to Defaults')
        ]),
        
        el.statusDiv('settingsStatus')
    ];

    return HtmlTemplateBuilder.buildDocument(config, elements);
}

/**
 * Example: Repository status template
 */
export function createRepositoryStatus(repoName: string, branchName: string, changeCount: number): string {
    const config: HtmlTemplateConfig = {
        title: 'Repository Status',
        cspSource: 'self',
        nonce: 'status-nonce',
        styles: [],
        scripts: []
    };

    const el = HtmlTemplateBuilder.createElements();
    
    const elements = [
        el.heading(`Repository: ${repoName}`),
        { 
            tag: 'div', 
            attributes: { class: 'repo-info' },
            children: [
                { tag: 'p', content: `Current Branch: ${branchName}` },
                { tag: 'p', content: `Changed Files: ${changeCount}` }
            ]
        }
    ];

    return HtmlTemplateBuilder.buildDocument(config, elements);
}
