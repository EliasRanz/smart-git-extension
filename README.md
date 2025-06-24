# Smart Git Extension

A comprehensive VS Code extension that enhances Git workflows with intelligent features including AI-powered commit messages, atomic commits, git tree visualization, and advanced Git operations.

## Features

### 🤖 Smart Commits
- **AI-Powered Commit Messages**: Generate conventional commit messages based on actual file diffs
- **Atomic Commit Selection**: Choose specific files with checkboxes for precise commits
- **Diff Integration**: Click files to view git diffs in VS Code's built-in viewer
- **Multiple AI Strategies**: Uses GitHub Copilot, intelligent analysis, or rule-based fallbacks

### 🌳 Enhanced Git Views
- **Smart Changes View**: Tree view of changed files organized by repository
- **Git Tree View**: Coming soon - IntelliJ-style commit history and branch visualization
- **Clean Interface**: Minimal, distraction-free UI focused on productivity

### ⚡ Intelligent Workflows
- **Context-Aware**: Analyzes your changes to suggest appropriate commit types
- **Progress Feedback**: Shows what's happening during operations
- **Error Prevention**: Validates commits before execution
- **Debug Tools**: Built-in troubleshooting for common Git issues

## Current Features

### Smart Commit Panel
- Commit message input with AI generation
- Amend checkbox for modifying previous commits  
- "Generate with AI" button for intelligent commit messages
- Commit and push options

### File Management
- Checkbox selection for atomic commits
- File status indicators (M, A, D, R, etc.)
- Context menus for file operations
- Direct diff viewing integration

## Planned Features

### 🔮 Coming Soon
- **Git Tree View**: IntelliJ-style commit history visualization
- **Branch Management**: Enhanced branch switching and merging
- **Conflict Resolution**: Smart merge conflict assistance
- **Commit Templates**: Customizable commit message templates
- **Team Integration**: Shared commit conventions and workflows

## Usage

1. **View Changed Files**: The extension automatically shows a clean tree view of changed files in your workspace
2. **Select Files**: Use checkboxes to select which files to include in your commit (atomic commits)
3. **View Diffs**: Click on any file to see its git diff in the main editor
4. **Generate Commit Message**: 
   - ✅ **Select the specific files** you want to commit using checkboxes
   - Open the commit panel in the Smart Git sidebar
   - Click "Generate with AI" 
   - The extension analyzes **only the selected files' diffs** and creates a conventional commit message
5. **Commit**: Review the message and commit your changes
6. **Explore Git Tree**: Coming soon - visualize your Git history like in IntelliJ IDEA

## AI Integration

The extension uses multiple approaches for intelligent commit message generation:

1. **GitHub Copilot**: Uses VS Code's Language Model API silently (if Copilot is available)
2. **Intelligent Analysis**: Analyzes diff patterns and file types to generate smart messages
3. **Rule-Based Fallback**: Uses pattern matching for reliable results

**Important**: The AI analysis works **only on the files you select** with checkboxes, ensuring atomic commits with relevant commit messages.

All approaches generate messages in conventional commit format:
- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes  
- `docs(scope): description` - Documentation
- `refactor(scope): description` - Code refactoring
- `test(scope): description` - Tests
- `chore(scope): description` - Maintenance

## Installation & Development

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to run the extension in a new Extension Development Host window
5. Open a git repository with some changes to test the features

## Commands

- `smart-git.generateCommitMessage` - Generate AI commit message  
- `smart-git.refresh` - Refresh file list
- `smart-git.showFileDiff` - Show file diff
- `smart-git.toggleFile` - Toggle file selection
- `smart-git.debugCommitSetup` - Debug commit setup issues
- `smart-git.showGitTree` - Show Git tree view (coming soon)

## Requirements

- VS Code 1.85.0 or higher
- A git repository with changes
- Optional: GitHub Copilot extension for enhanced AI generation

## Extension Settings

This extension contributes no configurable settings currently. All features work out of the box.

## Known Issues

- Very large diffs may be truncated for AI analysis
- Binary files show limited diff information
- Multi-repository workspaces require individual repository selection

## Release Notes

### 0.0.1
- Initial release
- Tree view for changed files with checkboxes
- Git diff integration
- AI-powered commit message generation
- IntelliJ-style commit panel

---

**Enjoy atomic commits with AI assistance!** 🚀
