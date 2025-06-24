# HTML Templating Solutions for VS Code Webviews

This document explains the HTML templating solutions implemented to address the large function size issue in webview providers.

## Problem Statement

The original HTML template generation in `CommitPanelProvider.ts` had a single large function (`_getHtmlForWebview`) that was 145+ lines long, violating our coding standards of maximum 50 lines per function.

## Solution 1: Structured Template Builder (`HtmlTemplateBuilder.ts`)

### Features
- **Declarative API**: Define HTML structure using JavaScript objects
- **Type Safety**: Full TypeScript support for HTML elements and attributes
- **Reusable Components**: Common UI elements (buttons, inputs, etc.) as helper methods
- **CSP Support**: Built-in Content Security Policy handling
- **Modular Design**: Separate concerns (head, body, elements)

### Usage Example
```typescript
const config: HtmlTemplateConfig = {
    title: 'Smart Git Commit',
    cspSource: webview.cspSource,
    nonce: getNonce(),
    styles: ['reset.css', 'vscode.css'],
    scripts: ['main.js']
};

const el = HtmlTemplateBuilder.createElements();
const elements = [
    el.heading('Smart Git Commit'),
    el.textarea('commitMessage', 'Enter commit message...', 4),
    el.buttonGroup([
        el.button('generateButton', 'Generate AI Message'),
        el.checkbox('amendCheckbox', 'Amend last commit')
    ])
];

return HtmlTemplateBuilder.buildDocument(config, elements);
```

### Benefits
- **Reduced Function Size**: Each template method is now < 20 lines
- **Better Maintainability**: Clear separation of concerns
- **Reusability**: Can be used for other webview panels
- **Type Safety**: Compile-time checking for HTML structure

## Solution 2: Advanced Template Builder (`AdvancedTemplateBuilder.ts`)

### Features
- **External Template Files**: Load `.html` templates from `templates/` directory
- **Placeholder Substitution**: Use `{{variableName}}` syntax for dynamic content
- **Fallback System**: Built-in templates when external files aren't available
- **Configuration Helpers**: Auto-generate common webview configurations
- **Error Handling**: Graceful fallback when templates are missing

### Usage Example
```typescript
// Using external template file
const templateData = AdvancedTemplateBuilder.createWebviewConfig(
    webview, extensionUri, 'Smart Git Commit'
);
return AdvancedTemplateBuilder.loadTemplate(extensionUri, 'commit-panel', templateData);

// Template file: templates/commit-panel.html
/*
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}}; script-src 'nonce-{{nonce}}';">
    <link href="{{styleReset}}" rel="stylesheet">
    <link href="{{styleVSCode}}" rel="stylesheet">
</head>
<body>
    <h1>Smart Git Commit</h1>
    <textarea id="commitMessage" placeholder="Enter commit message..." rows="4"></textarea>
    <!-- More HTML content -->
    <script nonce="{{nonce}}" src="{{mainScript}}"></script>
</body>
</html>
*/
```

### Benefits
- **Separation of Concerns**: HTML templates separate from TypeScript code
- **Designer Friendly**: Non-developers can edit HTML templates
- **Version Control**: Template changes tracked separately
- **Flexibility**: Easy to switch between different template styles

## Implementation Results

### Before Refactoring
- `_getHtmlForWebview`: 145+ lines (❌ Violation)
- Hard to maintain large string literals
- Mixed concerns (HTML structure + TypeScript logic)

### After Refactoring
- `_getHtmlForWebview`: 15 lines (✅ Compliant)
- `createCommitPanelElements`: 12 lines (✅ Compliant)
- `getWebviewResources`: 8 lines (✅ Compliant)
- Clear separation of concerns
- Reusable across different webview providers

## Recommended Usage

### For Simple Templates
Use `HtmlTemplateBuilder` when:
- Template structure is relatively simple
- You want full TypeScript type safety
- Template content is unlikely to change frequently
- You prefer programmatic template generation

### For Complex Templates
Use `AdvancedTemplateBuilder` when:
- Templates are large or complex
- You want to separate HTML from TypeScript
- Non-developers need to edit templates
- You need multiple template variations

## Future Enhancements

1. **Template Caching**: Cache parsed templates for better performance
2. **Template Validation**: Validate template syntax at build time
3. **Component System**: Create reusable component library
4. **Theme Support**: Dynamic theming for templates
5. **Internationalization**: Multi-language template support

## Migration Guide

To migrate existing webview providers:

1. **Identify Large Template Functions**: Look for functions > 50 lines with HTML strings
2. **Choose Template System**: Pick `HtmlTemplateBuilder` or `AdvancedTemplateBuilder`
3. **Extract Template Logic**: Move HTML generation to separate methods
4. **Add Type Safety**: Replace `any` types with proper interfaces
5. **Test Functionality**: Ensure webview still works correctly

This templating system successfully reduces function complexity while improving maintainability and reusability across the extension.
