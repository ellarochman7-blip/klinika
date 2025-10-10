# Klinika - AI Image Processor

A modern web application for processing and transforming images using Google's Imagen API (NanoBanana).

## Features

- 🎨 AI-powered image transformation
- 🖼️ Batch processing with multiple prompts
- 💧 Watermark support
- ⚡ Built with React, TypeScript, and Vite
- 🎭 Beautiful UI with Framer Motion animations
- 🎯 Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud account with Vertex AI API enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd klinika
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Google Cloud credentials:
   - Follow the guide in [CREDENTIALS_SETUP.md](./CREDENTIALS_SETUP.md)
   - Edit `src/config/credentials.ts` and add your API key and Project ID

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Usage

1. **Upload an Image**: Click or drag an image into the upload area
2. **Customize Prompts** (optional): Click the settings icon to modify the AI prompts
3. **Generate**: Click "Generate Images" to process your image with all prompts
4. **Download**: Click the download button on any generated image to save it with watermark

## Configuration

### API Settings

The application stores API credentials in `src/config/credentials.ts`. Edit this file to add:

- `apiKey`: Your Google Cloud API key
- `projectId`: Your Google Cloud Project ID

### Customizing Prompts

You can customize the AI prompts by:
1. Clicking the settings icon (⚙️) in the top-right corner
2. Editing the three prompt fields
3. Clicking "Save Settings"

### Adding a Watermark

1. Click the settings icon (⚙️)
2. Upload a logo image
3. All downloaded images will include your watermark

## Project Structure

```
klinika/
├── src/
│   ├── components/        # React components
│   │   ├── OutputGrid.tsx
│   │   ├── PromptSettings.tsx
│   │   └── UploadArea.tsx
│   ├── config/           # Configuration files
│   │   └── credentials.ts
│   ├── utils/            # Utility functions
│   │   ├── falClient.ts  # API client (renamed for compatibility)
│   │   └── imageProcessing.ts
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── .env.example          # Example environment variables
├── CREDENTIALS_SETUP.md  # Detailed setup guide
└── README.md            # This file
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Google Imagen API** - AI image generation
- **Lucide React** - Icons

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

[Your License Here]

## Support

For issues and questions:
- Check [CREDENTIALS_SETUP.md](./CREDENTIALS_SETUP.md) for API setup help
- Open an issue on GitHub
- Consult the [Google Cloud Documentation](https://cloud.google.com/vertex-ai/docs)
