# 🔊 AudioFlash Chrome Extension

A Chrome extension that uses the Murf Text-to-Speech API to read aloud selected text from any webpage, with automatic fallback to browser TTS.

## Features

- 🎯 **Text Selection**: Select any text on a webpage and convert it to speech
- 🎤 **Multiple Voices**: Choose from various AI voices and languages
- 🔐 **Secure API Storage**: API keys are stored securely in Chrome storage
- 🌊 **High-Quality Audio**: Real-time audio using Murf's API
- 🔄 **Automatic Fallback**: Falls back to browser TTS if API is unavailable
- 💾 **Persistent Preferences**: Remembers your voice selection
- 🎛️ **Web Audio API**: High-quality audio playback control
- 🎨 **Modern UI**: Clean, gradient-based popup interface

## Setup Instructions

### 1. Get Your Murf API Key

1. Sign up at [Murf.ai](https://murf.ai)
2. Navigate to your API dashboard
3. Generate a new API key
4. Copy the API key (starts with `murf_live_` or similar)

### 2. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the folder containing all the extension files
5. The AudioFlash extension should now appear in your extensions list

### 3. Configure Your API Key

1. Open the `.env` file in the extension folder
2. Replace the placeholder API key with your actual Murf API key

## How to Use

1. **Select Text**: Highlight any text on a webpage
2. **Open Extension**: Click the AudioFlash icon in your browser toolbar
3. **Choose Voice**: Select your preferred voice from the dropdown
4. **Play Audio**: Click the "Play" button to hear the text spoken aloud

## Troubleshooting

### Extension Won't Load
- Check that manifest.json is valid
- Verify you have all required files in the extension folder

### API Key Issues
- Ensure your API key starts with the correct prefix
- Check that your Murf account has sufficient credits
- Verify you're using the correct API key format

### Audio Issues
- The extension will automatically fall back to browser TTS if Murf API fails
- Check your browser's audio settings
- Ensure you have an active internet connection for Murf API

### No Text Selected
- Make sure to select text on the webpage before opening the extension
- Try refreshing the page and selecting text again
- Some websites may prevent text selection

## Technical Details

### Files Structure
- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Main extension logic
- `background.js` - Service worker for API validation

### Security Features
- API keys are stored securely using Chrome's storage API
- No hardcoded API keys in source code
- Background script validates API keys before use

## Development

### Testing the Extension

1. Load the extension in developer mode
2. Open browser developer tools (F12)
3. Check the Console tab for any error messages
4. Test with various text selections and voice options

### Modifying Voice Options

To add more voices, edit the `<select>` options in `popup.html`:

```html
<option value="new-voice-code">Voice Name (Language)</option>
```

Then ensure the voice code matches Murf's API voice parameters.

### API Rate Limits

Be aware of Murf API rate limits and implement proper error handling for:
- Rate limit exceeded (429 status)
- Insufficient credits (402 status)  
- Invalid API key (401 status)

## Support

For issues related to:
- **Extension functionality**: Check browser console for errors
- **Murf API**: Refer to [Murf API documentation](https://docs.murf.ai/)
- **Chrome Extensions**: See [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)

## License

This project is provided as-is for educational and personal use. Please comply with Murf.ai's terms of service when using their API.