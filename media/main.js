// @ts-check
(function() {
    const vscode = acquireVsCodeApi();

    const commitMessageTextarea = document.getElementById('commit-message');
    const amendCheckbox = document.getElementById('amend-checkbox');
    const commitButton = document.getElementById('commit-button');
    const commitPushButton = document.getElementById('commit-push-button');
    const aiGenerateButton = document.getElementById('ai-generate-button');

    // Handle AI generation button click
    aiGenerateButton?.addEventListener('click', () => {
        const aiIcon = aiGenerateButton.querySelector('.ai-icon');
        const aiText = aiGenerateButton.querySelector('.ai-text');
        const aiLoading = aiGenerateButton.querySelector('.ai-loading');
        
        // Show loading state
        if (aiIcon) aiIcon.style.display = 'none';
        if (aiText) aiText.textContent = 'Generating...';
        if (aiLoading) aiLoading.style.display = 'inline';
        aiGenerateButton.disabled = true;

        vscode.postMessage({
            type: 'generateCommitMessage'
        });
    });

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'commitMessageGenerated':
                {
                    const aiIcon = aiGenerateButton?.querySelector('.ai-icon');
                    const aiText = aiGenerateButton?.querySelector('.ai-text');
                    const aiLoading = aiGenerateButton?.querySelector('.ai-loading');
                    
                    // Reset button state
                    if (aiIcon) aiIcon.style.display = 'inline';
                    if (aiText) aiText.textContent = 'Generate with AI';
                    if (aiLoading) aiLoading.style.display = 'none';
                    if (aiGenerateButton) aiGenerateButton.disabled = false;

                    if (message.message && commitMessageTextarea) {
                        commitMessageTextarea.value = message.message;
                        commitMessageTextarea.focus();
                    } else if (message.error) {
                        // Could show error in UI, for now just log it
                        console.error('AI generation failed:', message.error);
                    }
                    break;
                }
        }
    });

    commitButton?.addEventListener('click', () => {
        const message = commitMessageTextarea?.value?.trim();
        if (!message) {
            vscode.postMessage({
                type: 'error',
                message: 'Commit message cannot be empty'
            });
            return;
        }

        vscode.postMessage({
            type: 'commit',
            message: message,
            amend: amendCheckbox?.checked || false
        });

        // Clear the message after committing
        if (commitMessageTextarea) {
            commitMessageTextarea.value = '';
        }
        if (amendCheckbox) {
            amendCheckbox.checked = false;
        }
    });

    commitPushButton?.addEventListener('click', () => {
        const message = commitMessageTextarea?.value?.trim();
        if (!message) {
            vscode.postMessage({
                type: 'error', 
                message: 'Commit message cannot be empty'
            });
            return;
        }

        vscode.postMessage({
            type: 'commitAndPush',
            message: message,
            amend: amendCheckbox?.checked || false
        });

        // Clear the message after committing
        if (commitMessageTextarea) {
            commitMessageTextarea.value = '';
        }
        if (amendCheckbox) {
            amendCheckbox.checked = false;
        }
    });
})();
