// AudioFlash Chrome Extension - Background Service Worker

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('AudioFlash extension installed/updated:', details.reason);

    // Set default preferences if this is a fresh install
    if (details.reason === 'install') {
        chrome.storage.local.set({
            selectedVoice: 'en-US-sara',
            apiKey: '' // User will need to set this
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('AudioFlash extension started');
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'checkApiKey':
            checkApiKeyStatus().then(sendResponse);
            return true; // Will respond asynchronously

        case 'validateApiKey':
            validateApiKey(request.apiKey).then(sendResponse);
            return true;

        default:
            console.log('Unknown message action:', request.action);
    }
});

// Check if API key is configured
async function checkApiKeyStatus() {
    try {
        const result = await chrome.storage.local.get(['apiKey']);
        return {
            hasApiKey: !!(result.apiKey && result.apiKey.trim()),
            apiKey: result.apiKey || ''
        };
    } catch (error) {
        console.error('Error checking API key status:', error);
        return { hasApiKey: false, apiKey: '' };
    }
}

// Validate API key by making a test request
async function validateApiKey(apiKey) {
    try {
        // Test the API key with a simple request
        const response = await fetch('https://api.murf.ai/v1/voices', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            valid: response.ok,
            status: response.status,
            message: response.ok ? 'API key is valid' : `API key validation failed: ${response.statusText}`
        };
    } catch (error) {
        console.error('API key validation error:', error);
        return {
            valid: false,
            status: 0,
            message: 'Network error during API key validation'
        };
    }
}