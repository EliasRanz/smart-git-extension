#!/bin/bash

# Test setup script for Smart Git Commit Extension
echo "🚀 Setting up test environment for Smart Git Commit Extension"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Creating one..."
    git init
    echo "✅ Git repository initialized"
fi

# Create some test files if they don't exist
if [ ! -f "test1.txt" ]; then
    echo "Creating test file 1..." > test1.txt
    echo "✅ Created test1.txt"
fi

if [ ! -f "test2.js" ]; then
    echo "console.log('Hello World');" > test2.js
    echo "✅ Created test2.js"
fi

# Make some changes to create git diff
echo "Modified at $(date)" >> test1.txt
echo "// Modified at $(date)" >> test2.js

echo ""
echo "📋 Git status:"
git status --short

echo ""
echo "🔧 To test the extension:"
echo "1. Open VS Code in this directory"
echo "2. Press F5 to run the extension in development mode"
echo "3. In the new window, look for 'SMART GIT COMMIT' in the sidebar"
echo "4. Select files using checkboxes"
echo "5. Try generating commit message with AI"
echo "6. Try committing"
echo ""
echo "🐛 For debugging:"
echo "- Open Developer Tools (Help > Toggle Developer Tools)"
echo "- Check the Console for debug logs"
echo "- Run 'Debug Commit Setup' command from Command Palette"
