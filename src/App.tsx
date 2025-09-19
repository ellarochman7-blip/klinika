import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import UploadArea from './components/UploadArea';
import PromptSettings from './components/PromptSettings';
import OutputGrid from './components/OutputGrid';
import { addWatermark, downloadImage } from './utils/imageProcessing';
import { batchGenerateImages } from './utils/falClient';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  isProcessing: boolean;
  error?: string;
}

const DEFAULT_PROMPTS = [
  'Transform this image into a vintage sepia-toned photograph with film grain texture and nostalgic atmosphere',
  'Apply a dreamy, ethereal filter with soft lighting, pastel colors, and magical bokeh effects',
  'Create a dramatic, cinematic version with bold shadows, highlights, and moody lighting'
];

function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [logo, setLogo] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleImageUpload = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setUploadedFile(file);
    setGeneratedImages([]);
    setHasGenerated(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uploadedFile || isProcessing) return;
    
    setIsProcessing(true);
    setHasGenerated(true);
    // Create initial processing states
    const initialImages: GeneratedImage[] = prompts.map((prompt, index) => ({
      id: `img-${index}`,
      prompt,
      imageUrl: null,
      isProcessing: true
    }));
    
    setGeneratedImages(initialImages);

    // Process all prompts in parallel using Fal AI
    try {
      const results = await batchGenerateImages(uploadedFile, prompts);
      
      const finalImages: GeneratedImage[] = results.map((result, index) => ({
        id: `img-${index}`,
        prompt: result.prompt,
        imageUrl: result.imageUrl,
        isProcessing: false,
        error: result.error
      }));
      
      setGeneratedImages(finalImages);
    } catch (error) {
      console.error('Error processing images:', error);
      setGeneratedImages(prev => 
        prev.map(img => ({ 
          ...img, 
          isProcessing: false,
          error: 'Processing failed'
        }))
      );
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, prompts, isProcessing]);

  const handleLogoChange = useCallback((file: File) => {
    const logoUrl = URL.createObjectURL(file);
    setLogo(logoUrl);
  }, []);

  const handleDownload = useCallback(async (imageUrl: string, prompt: string) => {
    try {
      const watermarkedImageUrl = await addWatermark(imageUrl, logo);
      const filename = `ai-generated-${Date.now()}.png`;
      downloadImage(watermarkedImageUrl, filename);
    } catch (error) {
      console.error('Error adding watermark:', error);
      // Fallback to download without watermark
      downloadImage(imageUrl, `ai-generated-${Date.now()}.png`);
    }
  }, [logo]);

  const handlePromptsChange = useCallback((newPrompts: string[]) => {
    setPrompts(newPrompts);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Image Processor
          </h1>
          <p className="text-gray-600 text-lg">
            Upload an image and transform it with AI-powered prompts
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Upload Image
              </h2>
              <UploadArea
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImage}
              />
              
              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Images
                      </>
                    )}
                  </motion.button>
                  
                  {hasGenerated && !isProcessing && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerate}
                      className="w-full mt-2 flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>

            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Processing Status
                </h3>
                <div className="space-y-2">
                  {prompts.map((prompt, index) => {
                    const image = generatedImages.find(img => img.id === `img-${index}`);
                    const isComplete = image && !image.isProcessing && image.imageUrl;
                    const isProcessing = image && image.isProcessing;
                    const hasFailed = image && !image.isProcessing && !image.imageUrl;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-2 rounded-md transition-colors duration-200 ${
                          isComplete ? 'bg-green-50' : isProcessing ? 'bg-blue-50' : hasFailed ? 'bg-red-50' : 'bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isComplete ? 'bg-green-500' : isProcessing ? 'bg-blue-500 animate-pulse' : hasFailed ? 'bg-red-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-700 truncate">
                          Prompt {index + 1}
                          {hasFailed && <span className="text-red-500 ml-1">(Failed)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Generated Images
              </h2>
              <OutputGrid
                images={generatedImages}
                onDownload={handleDownload}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <PromptSettings
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
        prompts={prompts}
        onPromptsChange={handlePromptsChange}
        logo={logo}
        onLogoChange={handleLogoChange}
      />
    </div>
  );
}

export default App;