// AudioFlash Chrome Extension - Popup Script
class AudioFlash {
    constructor() {
        this.API_BASE_URL = 'https://api.murf.ai/v1';
        this.API_KEY = process.env.API_KEY; // Embedded directly

        this.selectedText = '';
        this.audioContext = null;
        this.currentSource = null;
        this.isPlaying = false;

        this.initializeElements();
        this.bindEvents();
        this.loadPreferences();
        this.getSelectedText();
    }
    initializeElements() {
        this.elements = {
            selectedText: document.getElementById('selectedText'),
            voiceSelect: document.getElementById('voiceSelect'),
            playButton: document.getElementById('playButton'),
            playIcon: document.getElementById('playIcon'),
            playText: document.getElementById('playText'),
            status: document.getElementById('status'),
            error: document.getElementById('error'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            apiKeySection: document.getElementById('apiKeySection'),
            saveApiKeyButton: document.getElementById('saveApiKeyButton')
        };
    }
    bindEvents() {
        this.elements.playButton.addEventListener('click', () => this.handlePlay());
        this.elements.voiceSelect.addEventListener('change', () => this.savePreferences());
        this.elements.saveApiKeyButton?.addEventListener('click', () => this.saveApiKey());
    }
    async loadPreferences() {
        try {
            const result = await chrome.storage.local.get(['selectedVoice', 'apiKey']);
            if (result.selectedVoice) {
                this.elements.voiceSelect.value = result.selectedVoice;
            }
            if (result.apiKey) {
                this.API_KEY = result.apiKey;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    async savePreferences() {
        try {
            await chrome.storage.local.set({
                selectedVoice: this.elements.voiceSelect.value
            });
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    async checkApiKeySetup() {
        console.warn('API key setup is now handled server-side.');
    }

    showApiKeySection() {
        console.warn('API key section is no longer required.');
    }

    hideApiKeySection() {
        console.warn('API key section is no longer required.');
    }

    async saveApiKey() {
        console.warn('API key management is now handled server-side.');
    }

    async getSelectedText() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const selection = window.getSelection();
                    return selection.toString().trim();
                }
            });

            const text = results[0]?.result || '';

            if (text) {
                this.selectedText = text;
                this.elements.selectedText.textContent = text.length > 150
                    ? text.substring(0, 150) + '...'
                    : text;
                this.elements.playButton.disabled = false;
            } else {
                this.elements.selectedText.textContent = 'No text selected. Please select text on the webpage first.';
                this.elements.playButton.disabled = true;
            }
        } catch (error) {
            console.error('Error getting selected text:', error);
            this.showError('Unable to get selected text. Please try again.');
        }
    }
    async handlePlay() {
        if (this.isPlaying) {
            this.stopAudio();
            return;
        }

        if (!this.selectedText) {
            this.showError('No text selected. Please select text on the webpage first.');
            return;
        }

        if (!this.API_KEY) {
            this.showError('Please configure your Murf API key first.');
            this.showApiKeySection();
            return;
        }
        try {
            this.setPlayingState(true);
            this.updateStatus('Generating speech...');

            await this.synthesizeAndPlay(this.selectedText);

        } catch (error) {
            console.error('Error during text-to-speech:', error);

            // Try fallback Web Speech API if Murf API fails
            if (this.API_KEY) {
                this.updateStatus('Trying fallback speech synthesis...');
                try {
                    await this.synthesizeWithWebSpeech(this.selectedText);
                    this.updateStatus('Playback completed (using browser TTS)');
                } catch (fallbackError) {
                    console.error('Fallback TTS also failed:', fallbackError);
                    this.showError('Both Murf API and browser TTS failed. Please check your API key and internet connection.');
                }
            } else {
                this.showError(error.message || 'Failed to generate speech. Please try again.');
            }
        } finally {
            this.setPlayingState(false);
            if (!this.updateStatus.textContent.includes('completed')) {
                this.updateStatus('');
            }
        }
    }
    async synthesizeAndPlay(text) {
        const selectedVoice = this.elements.voiceSelect.value;
        const [language, region, voiceName] = selectedVoice.split('-');

        // Murf API configuration - using a more realistic endpoint structure
        const requestBody = {
            text: text,
            voiceId: voiceName,
            language: `${language}-${region}`,
            format: 'mp3',
            speed: 1.0,
            pitch: 1.0
        };

        try {
            const response = await fetch(`${this.API_BASE_URL}/speech/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`);
            }

            this.updateStatus('Receiving audio...');

            // Get audio data as array buffer
            const audioData = await response.arrayBuffer();

            // Play the audio
            await this.playAudioBuffer(audioData);

        } catch (error) {
            console.error('Speech synthesis error:', error);
            throw error;
        }
    }

    async playAudioBuffer(arrayBuffer) {
        try {
            // Initialize AudioContext if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.updateStatus('Playing audio...');

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Create and configure source
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = audioBuffer;
            this.currentSource.connect(this.audioContext.destination);

            // Handle playback end
            this.currentSource.onended = () => {
                this.setPlayingState(false);
                this.updateStatus('Playback completed');
                this.currentSource = null;
            };

            // Start playback
            this.currentSource.start(0);

        } catch (error) {
            console.error('Audio playback error:', error);
            throw new Error('Failed to play audio. Please check your browser settings.');
        }
    }

    stopAudio() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
        this.setPlayingState(false);
        this.updateStatus('Playback stopped');
    }

    setPlayingState(playing) {
        this.isPlaying = playing;
        this.elements.playButton.disabled = playing && !this.currentSource;

        if (playing) {
            this.elements.playIcon.textContent = '⏸️';
            this.elements.playText.textContent = 'Stop';
        } else {
            this.elements.playIcon.textContent = '▶️';
            this.elements.playText.textContent = 'Play';
        }
    }

    updateStatus(message) {
        this.elements.status.textContent = message;
    }

    showError(message) {
        this.elements.error.textContent = message;
        this.elements.error.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            this.elements.error.style.display = 'none';
        }, 5000);
    }

    // Fallback TTS using Web Speech API
    async synthesizeWithWebSpeech(text) {
        return new Promise((resolve, reject) => {
            if (!('speechSynthesis' in window)) {
                reject(new Error('Speech synthesis not supported in this browser'));
                return;
            }

            // Cancel any ongoing speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Try to find a voice that matches the selected option
            const voices = speechSynthesis.getVoices();
            const selectedVoice = this.elements.voiceSelect.value;
            const [language, region] = selectedVoice.split('-');
            const targetLang = `${language}-${region}`;

            const voice = voices.find(v => v.lang === targetLang) || voices[0];
            if (voice) {
                utterance.voice = voice;
            }

            utterance.onstart = () => {
                this.updateStatus('Playing with browser TTS...');
            };

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (event) => {
                reject(new Error(`Speech synthesis error: ${event.error}`));
            };

            speechSynthesis.speak(utterance);
        });
    }

    // Cleanup method to prevent memory leaks
    cleanup() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(console.error);
            this.audioContext = null;
        }

        // Cancel any ongoing Web Speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const audioFlash = new AudioFlash();

    // Cleanup when popup is closed
    window.addEventListener('beforeunload', () => {
        audioFlash.cleanup();
    });
});