# Google AI Studio (Imagen) Credentials Setup

This guide will help you set up your Google AI Studio credentials to use Imagen for AI image generation with your high-fashion editorial prompts.

## Prerequisites

- A Google account
- Access to Google AI Studio (free tier available)

## Quick Start (2 Steps!)

### Step 1: Get Your API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Select or create a project
5. Copy your API key (starts with `AIzaSy...`)

### Step 2: Configure in the App

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and you'll see a **"Setup Required"** button in the top-right corner

3. Click the button to open the credentials settings modal

4. **⚠️ PASTE YOUR API KEY HERE** - in the "Google AI Studio API Key" field

5. Click **"Save Credentials"**

That's it! Your credentials are now saved in your browser's localStorage and will persist across sessions.

### Step 3: Test Your Setup

1. Upload a portrait image
2. The app will use the high-fashion editorial prompt by default
3. Click **"Generate Images"**
4. Wait for the AI to process (may take 20-40 seconds per image)
5. View your generated magazine cover-style images!

**Model Used**: `gemini-2.5-flash-image` - Google's image generation model that preserves facial features from your reference photo.

## Troubleshooting

### "Invalid API configuration" Error
- Make sure you've entered your credentials in the Settings modal
- Click the Settings button and verify both fields are filled
- The "Setup Required" button will stop pulsing when credentials are configured

### "API request failed: 401" Error
- Double-check your API key is correct (starts with `AIzaSy...`)
- Make sure you copied the entire key without extra spaces
- Try generating a new API key from Google AI Studio
- Verify the API key is saved correctly in Settings

### "API request failed: 403" Error
- Your API key might not have access to the Imagen model
- Check if you have access to Imagen in your Google AI Studio account
- Some features may require additional permissions or be region-restricted

### "API request failed: 429" Error
- You've exceeded your API quota
- Check your usage in Google Cloud Console > Billing
- Request a quota increase if needed

### Clear Saved Credentials
- Open the Settings modal
- Click "Clear Credentials" at the bottom
- Re-enter your credentials

## Security Best Practices

1. **Local storage only** - Credentials are stored in your browser's localStorage and only sent to Google AI Studio's API
2. **Restrict your API key** - In Google AI Studio, you can set IP/domain restrictions
3. **Monitor your usage** - Check your usage in Google AI Studio dashboard
4. **Rotate keys regularly** - Create new API keys periodically for security
5. **Clear on shared computers** - Use "Clear Credentials" if you're on a public/shared computer

✅ **Benefits**: 
- Simple API key authentication (no OAuth complexity!)
- Credentials stored locally in browser
- No backend server needed
- Persists across sessions

## API Costs & Limits

Google AI Studio offers:
- **Free tier** with generous limits for testing
- Check current pricing and quotas at: https://ai.google.dev/pricing

Monitor your usage:
1. Go to [Google AI Studio Dashboard](https://aistudio.google.com)
2. View your API usage and remaining quota

## Support

- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Get API Key](https://aistudio.google.com/app/apikey)

