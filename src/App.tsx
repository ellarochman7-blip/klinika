import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import UploadArea from './components/UploadArea';
import PromptSettings from './components/PromptSettings';
import OutputGrid from './components/OutputGrid';
import CredentialsSettings from './components/CredentialsSettings';
import { addWatermark, addVideoWatermark, downloadMedia } from './utils/imageProcessing';
import { batchGenerateImages, GenerationOptions } from './utils/falClient';
import { validateConfig } from './config/credentials';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  isProcessing: boolean;
  error?: string;
}

const DEFAULT_PROMPTS = [
  'High-fashion editorial magazine cover, inspired by Vogue Italy. Background: minimal, soft sandy-beige tones, creating a clean and elegant desert-like backdrop. Wardrobe: pleated white couture gown with flowing long sleeves, deep V neckline, and refined texture. Accessories: oversized structured white hat with dramatic pleated brim, partially shading the face, adding mystery and elegance. Lighting: natural sunlight, soft and directional, casting gentle shadows across the face and outfit, enhancing contours. Pose: upper body frontal with graceful posture, eyes directed towards the camera, expression serene, powerful, and timeless. Typography: large, refined white serif font at the top spelling "ETERNO" as the magazine masthead, styled seamlessly like a true luxury cover. Face: use the uploaded face as the exact base. Preserve identity 100%. Enhancement: subtle, realistic upgrade – luminous and smooth skin, bright clear eyes, refined details, balanced natural proportions. The result must remain fully realistic, as if photographed at peak beauty, without altering the person\'s unique features.',
  'Elegant minimalist portrait: soft natural lighting, clean white background, subtle makeup emphasizing natural beauty, professional studio quality, high-end beauty photography style, preserve facial identity completely',
  'Dramatic fashion portrait: bold lighting with strong shadows, editorial magazine quality, sophisticated styling, timeless elegance, maintain exact facial features and identity'
];

const DEFAULT_VIDEO_PROMPTS = [
  'Subtle camera zoom in with soft hair movement in a gentle breeze',
  'Natural head turn with cinematic lighting, smooth and elegant motion',
  'Dynamic camera pan with dramatic wind effect and flowing fabric'
];

const STORAGE_KEY = 'ai_image_prompts';
const VIDEO_PROMPTS_STORAGE_KEY = 'ai_video_prompts';
const VIDEO_QUOTA_KEY = 'video_generation_quota';
const DAILY_VIDEO_LIMIT = 10; // Adjust based on your API quota

// Load prompts from localStorage or use defaults
const loadPrompts = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMPTS;
    }
  } catch (error) {
    console.error('Failed to load prompts from localStorage:', error);
  }
  return DEFAULT_PROMPTS;
};

// Load video prompts from localStorage or use defaults
const loadVideoPrompts = (): string[] => {
  try {
    const stored = localStorage.getItem(VIDEO_PROMPTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_VIDEO_PROMPTS;
    }
  } catch (error) {
    console.error('Failed to load video prompts from localStorage:', error);
  }
  return DEFAULT_VIDEO_PROMPTS;
};

// Save prompts to localStorage
const savePrompts = (prompts: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error('Failed to save prompts to localStorage:', error);
  }
};

// Save video prompts to localStorage
const saveVideoPrompts = (prompts: string[]): void => {
  try {
    localStorage.setItem(VIDEO_PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error('Failed to save video prompts to localStorage:', error);
  }
};

// Video quota management
interface QuotaData {
  count: number;
  date: string;
}

const getVideoQuota = (): QuotaData => {
  try {
    const stored = localStorage.getItem(VIDEO_QUOTA_KEY);
    if (stored) {
      const data: QuotaData = JSON.parse(stored);
      const today = new Date().toDateString();
      // Reset quota if it's a new day
      if (data.date !== today) {
        return { count: 0, date: today };
      }
      return data;
    }
  } catch (error) {
    console.error('Failed to load quota:', error);
  }
  return { count: 0, date: new Date().toDateString() };
};

const saveVideoQuota = (count: number): void => {
  try {
    const data: QuotaData = {
      count,
      date: new Date().toDateString()
    };
    localStorage.setItem(VIDEO_QUOTA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save quota:', error);
  }
};

const incrementVideoQuota = (): number => {
  const quota = getVideoQuota();
  const newCount = quota.count + 1;
  saveVideoQuota(newCount);
  return newCount;
};

function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [prompts, setPrompts] = useState<string[]>(loadPrompts);
  const [videoPrompts, setVideoPrompts] = useState<string[]>(loadVideoPrompts);
  const [logo, setLogo] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [videoQuotaUsed, setVideoQuotaUsed] = useState(getVideoQuota().count);

  // Check if credentials are configured on mount
  useEffect(() => {
    setHasCredentials(validateConfig());
  }, []);

  // Save prompts to localStorage whenever they change
  useEffect(() => {
    savePrompts(prompts);
  }, [prompts]);

  // Save video prompts to localStorage whenever they change
  useEffect(() => {
    saveVideoPrompts(videoPrompts);
  }, [videoPrompts]);

  const handleImageUpload = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setUploadedFile(file);
    setGeneratedImages([]);
    setHasGenerated(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uploadedFile || isProcessing) return;

    // Check credentials before processing
    if (!validateConfig()) {
      alert('Please configure your API credentials in Settings first.');
      setIsCredentialsOpen(true);
      return;
    }
    
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

    // Process all prompts in parallel (static images only)
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
      const isVideo = imageUrl.startsWith('data:video/');
      
      if (isVideo) {
        // Handle video download with watermark
        const watermarkedVideoUrl = await addVideoWatermark(imageUrl, logo);
        const filename = `ai-generated-video-${Date.now()}.webm`;
        downloadMedia(watermarkedVideoUrl, filename);
      } else {
        // Handle image download with watermark
        const watermarkedImageUrl = await addWatermark(imageUrl, logo);
        const filename = `ai-generated-${Date.now()}.png`;
        downloadMedia(watermarkedImageUrl, filename);
      }
    } catch (error) {
      console.error('Error adding watermark:', error);
      // Fallback to download without watermark
      const isVideo = imageUrl.startsWith('data:video/');
      const filename = isVideo 
        ? `ai-generated-video-${Date.now()}.webm`
        : `ai-generated-${Date.now()}.png`;
      downloadMedia(imageUrl, filename);
    }
  }, [logo]);

  const handlePromptsChange = useCallback((newPrompts: string[]) => {
    setPrompts(newPrompts);
  }, []);

  const handleGenerateVideoFromImage = useCallback((imageUrl: string) => {
    setSelectedImageForVideo(imageUrl);
    setIsVideoModalOpen(true);
  }, []);

  const handleVideoGeneration = useCallback(async () => {
    if (!selectedImageForVideo || !videoPrompt.trim()) return;

    // Check quota
    const quota = getVideoQuota();
    if (quota.count >= DAILY_VIDEO_LIMIT) {
      alert(`Daily video generation limit reached (${DAILY_VIDEO_LIMIT} videos per day). The quota will reset tomorrow.`);
      return;
    }

    const videoId = `video-${Date.now()}`;
    
    try {
      setIsProcessing(true);
      
      // Increment quota immediately
      const newCount = incrementVideoQuota();
      setVideoQuotaUsed(newCount);
      
      // Immediately add a loading placeholder to the results grid
      const loadingVideo: GeneratedImage = {
        id: videoId,
        prompt: `🎬 VIDEO: ${videoPrompt}`,
        imageUrl: null,
        isProcessing: true
      };
      
      setGeneratedImages(prev => [...prev, loadingVideo]);
      
      // Close modal but keep processing
      setIsVideoModalOpen(false);
      
      // Convert data URL back to File for processing
      const response = await fetch(selectedImageForVideo);
      const blob = await response.blob();
      const file = new File([blob], 'generated-image.png', { type: 'image/png' });

      // Generate video from the selected image
      const options: GenerationOptions = {
        generateMotion: true,
        aspectRatio
      };

      const videoUrl = await batchGenerateImages(file, [videoPrompt], options);
      
      if (videoUrl && videoUrl[0].imageUrl) {
        // Update the loading placeholder with the actual video
        setGeneratedImages(prev => 
          prev.map(img => 
            img.id === videoId 
              ? { ...img, imageUrl: videoUrl[0].imageUrl, isProcessing: false }
              : img
          )
        );
        
        // Show success notification
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      } else {
        // Update with error state
        setGeneratedImages(prev => 
          prev.map(img => 
            img.id === videoId 
              ? { ...img, isProcessing: false, error: 'Video generation failed' }
              : img
          )
        );
      }
      
      // Clear form
      setVideoPrompt('');
      setSelectedImageForVideo(null);
    } catch (error) {
      console.error('Video generation failed:', error);
      
      // Check if it's a quota error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                           errorMessage.toLowerCase().includes('limit') ||
                           errorMessage.toLowerCase().includes('429');
      
      if (isQuotaError) {
        alert('❌ API Quota Exceeded\n\nYou have reached your API quota limit. This could be:\n• Daily video generation limit\n• API rate limit\n• Billing/quota issue with your Google AI account\n\nPlease check your Google AI Studio quota settings or try again later.');
      }
      
      // Update the placeholder with error
      setGeneratedImages(prev => 
        prev.map(img => 
          img.id === videoId 
            ? { 
                ...img, 
                isProcessing: false, 
                error: isQuotaError ? 'Quota exceeded' : errorMessage
              }
            : img
        )
      );
      
      setVideoPrompt('');
      setSelectedImageForVideo(null);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImageForVideo, videoPrompt, aspectRatio]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                AI Image Processor
              </h1>
              <p className="text-gray-600 text-lg">
                Upload an image and transform it with AI-powered prompts
              </p>
            </div>
            <div className="flex-1 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="Manage Prompts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Prompts</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCredentialsOpen(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  hasCredentials
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-red-100 hover:bg-red-200 text-red-700 animate-pulse'
                }`}
                title={hasCredentials ? 'API Settings' : 'Configure API Credentials'}
              >
                <SettingsIcon className="w-5 h-5" />
                <span>{hasCredentials ? 'API' : 'Setup Required'}</span>
              </motion.button>
            </div>
          </div>
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
                Generated Images & Videos
              </h2>
              <OutputGrid
                images={generatedImages}
                onDownload={handleDownload}
                onGenerateVideo={handleGenerateVideoFromImage}
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
        videoPrompts={videoPrompts}
        onVideoPromptsChange={setVideoPrompts}
        logo={logo}
        onLogoChange={handleLogoChange}
      />

      <CredentialsSettings
        isOpen={isCredentialsOpen}
        onClose={() => setIsCredentialsOpen(false)}
        onCredentialsSaved={() => {
          setHasCredentials(validateConfig());
        }}
      />

      {/* Video Generation Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsVideoModalOpen(false)}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Generate Video from Image</span>
              </h2>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedImageForVideo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Image:</p>
                <img
                  src={selectedImageForVideo}
                  alt="Selected"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              {/* Quota Display */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Daily Video Quota</span>
                  <span className="text-sm font-bold text-purple-600">
                    {videoQuotaUsed} / {DAILY_VIDEO_LIMIT}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      videoQuotaUsed >= DAILY_VIDEO_LIMIT 
                        ? 'bg-red-500' 
                        : videoQuotaUsed >= DAILY_VIDEO_LIMIT * 0.8 
                        ? 'bg-yellow-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min((videoQuotaUsed / DAILY_VIDEO_LIMIT) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {videoQuotaUsed >= DAILY_VIDEO_LIMIT 
                    ? '⚠️ Quota exhausted. Resets tomorrow.' 
                    : `${DAILY_VIDEO_LIMIT - videoQuotaUsed} videos remaining today`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Saved Video Prompts
                </label>
                <div className="space-y-2 mb-3">
                  {videoPrompts.map((savedPrompt, index) => (
                    <button
                      key={index}
                      onClick={() => setVideoPrompt(savedPrompt)}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors"
                    >
                      {savedPrompt.length > 80 ? savedPrompt.substring(0, 80) + '...' : savedPrompt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Video Motion Prompt
                </label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe the motion you want... (e.g., 'Subtle camera zoom in with soft hair movement in a gentle breeze')"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className={`w-12 h-7 border-2 rounded ${aspectRatio === '16:9' ? 'border-white' : 'border-gray-400'}`}></div>
                      <span>16:9 Landscape</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setAspectRatio('9:16')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className={`w-7 h-12 border-2 rounded ${aspectRatio === '9:16' ? 'border-white' : 'border-gray-400'}`}></div>
                      <span>9:16 Portrait</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>⚠️ Note:</strong> Video generation takes 60-120 seconds. The video will appear in the results grid when complete.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVideoGeneration}
                disabled={!videoPrompt.trim() || isProcessing || videoQuotaUsed >= DAILY_VIDEO_LIMIT}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 ${
                  !videoPrompt.trim() || isProcessing || videoQuotaUsed >= DAILY_VIDEO_LIMIT
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
                }`}
              >
                {videoQuotaUsed >= DAILY_VIDEO_LIMIT ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Quota Exhausted</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Generate Video</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3"
        >
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Video Generated! 🎬</p>
            <p className="text-sm text-green-100">Your video is ready in the results grid</p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="ml-4 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default App;