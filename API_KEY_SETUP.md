# 🔑 How to Add Your API Key

## Quick Setup (Takes 2 minutes!)

### 1. Get Your Google AI Studio API Key

Go to: **https://aistudio.google.com/app/apikey**

- Sign in with your Google account
- Click "Get API Key" or "Create API Key"  
- Select or create a project
- **Copy your API key** (starts with `AIzaSy...`)

### 2. Add It to the App

1. Run the app:
   ```bash
   npm run dev
   ```

2. Click the **"Setup Required"** button (top-right corner)

3. **⚠️ PASTE YOUR API KEY** in the "Google AI Studio API Key" field

4. Click **"Save Credentials"**

5. Done! Your key is saved in localStorage

### 3. Test It

**Step 1: Generate Images**
1. Upload a portrait photo
2. Click "Generate Images"  
3. Wait 20-40 seconds per image
4. See your high-fashion magazine covers in the results!

**Step 2: Create Video from Any Image (Optional) 🎬**
1. Find an image you like in the results
2. Click the **"Generate Video"** button below the image
3. A modal opens showing the selected image
4. Enter a video motion prompt (e.g., "Slow camera zoom with gentle hair movement")
5. Select intensity: Subtle, Moderate, or Dynamic
6. Click "Generate Video"
7. **Modal closes** - a loading card appears in the results grid
8. Loading card shows: 🎬 Generating Video with animated spinner
9. Wait 60-120 seconds in the background
10. When complete, video replaces the loading card
11. Success notification appears: "Video Generated! 🎬"

## What's Happening

The app uses **Google's AI models**:

### Image Generation (default)
- Model: `gemini-2.5-flash-image`
- Takes your uploaded photo as a reference
- Preserves the person's identity
- Applies your high-fashion editorial styling
- Generates static magazine cover-style images

### Video Generation (optional) 🎬
- Model: `veo-3.0-generate-001` (Google's latest video generation model)
- Uses file upload + polling API (long-running operation)
- Creates 5-second square videos from your image
- Maintains facial identity while adding cinematic motion
- Three intensity levels: Subtle, Moderate, Dynamic
- Processing time: 60-120 seconds (polls every 10 seconds)
- Max timeout: 10 minutes

---

## Watermark Logo (SVG Supported!)

You can add your logo as a watermark on downloaded images:

1. Click the **"Prompts"** button
2. Scroll to the "Watermark Logo" section
3. Upload your logo (PNG, JPG, or **SVG**)
4. SVG logos will scale perfectly at any size!

The logo appears in the bottom-left corner with a semi-transparent background.

---

## Motion Generation Feature 🎬

Create animated videos from your generated images!

### Two-Step Process:

**Step 1: Generate Static Images**
- Create multiple image variations with your prompts
- Review and select your favorite results

**Step 2: Add Motion to Selected Images**
1. Click "Generate Video" button on any generated image
2. Write a custom motion prompt describing the animation
3. Choose intensity:
   - **Subtle**: Gentle movements, soft camera motion
   - **Moderate**: Natural movements, smooth panning (recommended)
   - **Dynamic**: Bold movements, dramatic cinematography
4. Hit "Generate Video" and wait

### Example Motion Prompts:
- "Slow camera zoom in with soft hair movement in a gentle breeze"
- "Dramatic lighting shift with slight head turn, cinematic quality"
- "Subtle breathing motion with elegant posture, magazine editorial style"
- "Dynamic camera pan from left to right, fashion runway energy"

### What to Expect:
- **Output**: Short video (MP4 format)
- **Duration**: 3-5 second loops
- **Processing**: 60-120 seconds per video
- **Loading State**: Beautiful purple gradient card with spinning loader
- **Background Processing**: Modal closes, you can continue working
- **Source**: Uses your selected generated image
- **Identity**: Facial features preserved from the image
- **Motion**: Custom animation based on your prompt
- **Notification**: Green success toast when video is ready

### Important Notes:
- ⚠️ Video generation uses Google's `veo-3.0-generate-001` model (latest version)
- Uses the proper file upload + polling API pattern
- May not be available in all regions yet (still in limited preview)
- If you get a 404 error, the model isn't available in your region yet
- Each image can generate multiple videos with different prompts
- Videos are 5 seconds long in 1:1 aspect ratio (square)
- Videos appear in the results grid alongside images
- Videos have playback controls (play, pause, loop)
- Download works for both images and videos

---

## Your Default Prompt

The app is configured with your "ETERNO" magazine cover prompt:

> High-fashion editorial magazine cover, inspired by Vogue Italy. Background: minimal, soft sandy-beige tones... [full prompt preserved]

This prompt will be used by default for all image generations.

---

## Where is the API Key Used?

📍 **File**: `src/utils/falClient.ts`  
📍 **Line**: ~50 (marked with comment `⚠️ YOUR API KEY IS USED HERE`)

The key is retrieved from localStorage and sent to Google's Imagen API endpoint.

---

## Troubleshooting

**401 Error?**
- Check your API key is correct (starts with `AIzaSy...`)
- Make sure you copied the whole key
- Try generating a new key

**404 or Model Not Found?**
- The `gemini-2.5-flash-image` or `veo-3.0-generate-001` models might not be available in your region
- Video generation (`veo-3.0-generate-001`) is very new and may have limited availability
- Try static image generation first if video fails
- Check Google AI Studio for model availability in your region
- `veo-3.0-generate-001` is still in limited preview and may not be accessible to all accounts yet
- The model requires special access in some regions

**Still not working?**
- Check browser console for detailed error messages
- Verify you have internet connection
- Make sure localStorage is enabled in your browser

---

## Need Help?

See full documentation in `CREDENTIALS_SETUP.md`

