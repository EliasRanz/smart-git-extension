/**
 * HTML template builder utility for VS Code webviews.
 * Provides a structured approach to building HTML templates with proper CSP support.
 */

export interface HtmlTemplateConfig {
    title: string;
    cspSource: string;
    nonce: string;
    styles: string[];
    scripts: string[];
}

export interface HtmlElement {
    tag: string;
    attributes?: Record<string, string>;
    content?: string;
    children?: HtmlElement[];
}

/**
 * Utility class for building HTML templates in a structured way.
 */
export class HtmlTemplateBuilder {
    /**
     * Builds a complete HTML document.
     */
    public static buildDocument(config: HtmlTemplateConfig, bodyElements: HtmlElement[]): string {
        const head = this.buildHead(config);
        const body = this.buildBody(bodyElements, config.scripts, config.nonce);
        
        return `<!DOCTYPE html>
<html lang="en">
${head}
${body}
</html>`;
    }

    /**
     * Builds the HTML head section.
     */
    private static buildHead(config: HtmlTemplateConfig): string {
        const csp = `default-src 'none'; style-src ${config.cspSource}; script-src 'nonce-${config.nonce}';`;
        const styleLinks = config.styles.map(style => `    <link href="${style}" rel="stylesheet">`).join('\n');
        
        return `<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${styleLinks}
    <title>${config.title}</title>
</head>`;
    }

    /**
     * Builds the HTML body section.
     */
    private static buildBody(elements: HtmlElement[], scripts: string[], nonce: string): string {
        const elementsHtml = elements.map(el => this.buildElement(el)).join('\n    ');
        const scriptTags = scripts.map(script => `    <script nonce="${nonce}" src="${script}"></script>`).join('\n');
        
        return `<body>
    ${elementsHtml}
${scriptTags}
</body>`;
    }

    /**
     * Builds an individual HTML element.
     */
    private static buildElement(element: HtmlElement): string {
        const attributes = element.attributes 
            ? Object.entries(element.attributes).map(([key, value]) => `${key}="${value}"`).join(' ')
            : '';
        const attrString = attributes ? ` ${attributes}` : '';
        
        if (element.children && element.children.length > 0) {
            const childrenHtml = element.children.map(child => this.buildElement(child)).join('\n        ');
            return `<${element.tag}${attrString}>
        ${childrenHtml}
    </${element.tag}>`;
        }
        
        if (element.content !== undefined) {
            return `<${element.tag}${attrString}>${element.content}</${element.tag}>`;
        }
        
        return `<${element.tag}${attrString}></${element.tag}>`;
    }

    /**
     * Creates common UI elements for VS Code webviews.
     */
    public static createElements(): {
        heading: (text: string, level?: number) => HtmlElement;
        textarea: (id: string, placeholder: string, rows?: number) => HtmlElement;
        button: (id: string, text: string, type?: string) => HtmlElement;
        buttonGroup: (children: HtmlElement[]) => HtmlElement;
        checkbox: (id: string, text: string) => HtmlElement;
        statusDiv: (id?: string) => HtmlElement;
    } {
        return {
            heading: (text: string, level: number = 1): HtmlElement => ({
                tag: `h${level}`,
                content: text
            }),
            
            textarea: (id: string, placeholder: string, rows: number = 4): HtmlElement => ({
                tag: 'textarea',
                attributes: { id, placeholder, rows: rows.toString() }
            }),
            
            button: (id: string, text: string, type: string = 'button'): HtmlElement => ({
                tag: 'button',
                attributes: { id, type },
                content: text
            }),
            
            buttonGroup: (children: HtmlElement[]): HtmlElement => ({
                tag: 'div',
                attributes: { class: 'button-group' },
                children
            }),
            
            checkbox: (id: string, text: string): HtmlElement => ({
                tag: 'label',
                children: [
                    { tag: 'input', attributes: { type: 'checkbox', id } },
                    { tag: 'span', content: ` ${text}` }
                ]
            }),
            
            statusDiv: (id: string = 'statusMessage'): HtmlElement => ({
                tag: 'div',
                attributes: { id }
            })
        };
    }
}
