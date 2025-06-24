# Smart Git - Troubleshooting Guide

## Issues Encountered

### 1. "Extension not found"
**Cause**: Publisher ID mismatch in package.json
**Fix**: Updated to use `smart-git-dev` publisher and `smart-git` extension name

### 2. "Commit failed: Failed to execute git"
**Possible Causes**:
- No files selected for commit
- Git repository not properly initialized
- Git extension not loaded
- Repository API methods not available

## Debugging Steps

### Step 1: Check Extension Loading
1. Open Developer Tools (Help > Toggle Developer Tools)
2. Look for these console messages:
   ```
   Congratulations, your extension "smart-git" is now active!
   Getting Git API...
   Git API found, state: initialized
   GitService initialized, repositories: 1
   ```

### Step 2: Run Debug Command
1. Open Command Palette (Cmd+Shift+P)
2. Run: `Debug Commit Setup`
3. Check the result message for issues

### Step 3: Check File Selection
1. Verify files are checked (✅) in the Changes view
2. Console should show: `Generating commit message for X selected files`

### Step 4: Manual Testing
1. Create a test repository:
   ```bash
   mkdir test-repo
   cd test-repo
   git init
   echo "test" > test.txt
   git add test.txt
   git commit -m "initial"
   echo "modified" >> test.txt
   ```
2. Open in VS Code
3. Run extension (F5)

## Common Issues & Solutions

### No Repository Found
- Ensure you're in a git repository
- Check that Git extension is enabled in VS Code
- Restart VS Code and try again

### Files Not Appearing
- Make sure files have actual changes (`git status` should show them)
- Try refreshing the view (click refresh button)

### Commit Fails
- Check that files are selected (checkboxes)
- Ensure commit message is not empty
- Check console for specific error messages

### Extension Not Loading
- Check that all dependencies are installed (`npm install`)
- Rebuild the extension (`npm run compile`)
- Check for TypeScript compilation errors

## Console Logs to Look For

### Successful Flow:
```
Congratulations, your extension "intellij-commit" is now active!
Git API found, state: initialized
GitService initialized, repositories: 1
Received message from webview: {type: 'commit', message: '...'}
Starting commit process...
Staging 2 selected files: [...]
Commit setup validation: (all checks pass)
About to commit...
Commit completed successfully
```

### Error Indicators:
```
Git API not found
No active repository found
No files selected for staging
Repository.add method not available
Failed to stage files: ...
```

## If All Else Fails

1. **Reset Extension State**:
   - Close VS Code
   - Delete `.vscode` folder in workspace
   - Restart VS Code

2. **Clean Rebuild**:
   ```bash
   rm -rf node_modules
   npm install
   npm run compile
   ```

3. **Test with Built-in Git**:
   - Try using VS Code's built-in Source Control view
   - Ensure basic git operations work there first

4. **Check Git Configuration**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```
