import { getConfig, validateConfig } from '../config/credentials';
import { GoogleGenAI } from '@google/genai';

// Using Google GenAI with gemini-2.5-flash-image model for images
// and veo-3.0-generate-001 for video/motion generation
// ⚠️ API Key should be pasted in the Settings modal
// Get your key from: https://aistudio.google.com/app/apikey

export interface GenerationOptions {
  generateMotion?: boolean; // Optional: generate video instead of static image
  aspectRatio?: '16:9' | '9:16'; // Video aspect ratio
}

// Helper function to convert File to base64 data URL
const fileToDataURL = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to resize image to match aspect ratio
const resizeImageToAspectRatio = async (
  file: File,
  aspectRatio: '16:9' | '9:16'
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Calculate target dimensions based on aspect ratio
        const targetRatio = aspectRatio === '16:9' ? 16 / 9 : 9 / 16;
        const sourceRatio = img.width / img.height;
        
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        
        // Crop to match target aspect ratio (center crop)
        if (sourceRatio > targetRatio) {
          // Image is wider than target, crop width
          sourceWidth = img.height * targetRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else if (sourceRatio < targetRatio) {
          // Image is taller than target, crop height
          sourceHeight = img.width / targetRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        // Set canvas to a reasonable size (max 1920x1080 for 16:9 or 1080x1920 for 9:16)
        if (aspectRatio === '16:9') {
          canvas.width = 1920;
          canvas.height = 1080;
        } else {
          canvas.width = 1080;
          canvas.height = 1920;
        }
        
        // Draw cropped and resized image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, canvas.width, canvas.height
        );
        
        // Convert to blob and then to file
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, file.type, 0.95);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Helper function to generate video with motion from image
const generateVideoWithMotion = async (
  ai: any,
  imageFile: File,
  prompt: string,
  apiKey: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
  try {
    const fullPrompt = `${prompt}`;

    console.log('Preparing image and starting video generation with veo-3.0-generate-001 model...');
    console.log(`Resizing image to ${aspectRatio} aspect ratio to prevent black borders...`);

    // Resize image to match target aspect ratio to prevent black borders
    const resizedImage = await resizeImageToAspectRatio(imageFile, aspectRatio);

    // Convert the resized image file to base64 for the video generation source.image
    const imageDataUrl = await fileToDataURL(resizedImage);
    const base64Image = imageDataUrl.split(',')[1];

    // Generate video from prompt + image using proper parameters per SDK types
    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-generate-001',
      source: {
        prompt: fullPrompt,
        image: {
          imageBytes: base64Image,
          mimeType: imageFile.type,
        },
        config: {
          aspectRatio: aspectRatio,
        },
      },
    });

    console.log('Video generation started, polling for completion...');
    console.log('Operation:', operation);

    // Poll the operation status until the video is ready
    let pollCount = 0;
    const maxPolls = 60; // Max 10 minutes (60 * 10 seconds)
    let status;

    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        status = await ai.operations.getVideosOperation({ operation });
        console.log(`Polling... (${pollCount * 10}s elapsed), status:`, status?.done ? 'done' : 'processing');
        
        if (status.done) {
          break;
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling even if there's an error
      }
      
      pollCount++;
    }

    if (!status || !status.done) {
      throw new Error('Video generation timed out after 10 minutes');
    }

    console.log('Video generation complete!', status);

    // Check for RAI (Responsible AI) filtering
    if (status.response?.raiMediaFilteredCount && status.response.raiMediaFilteredCount > 0) {
      const reasons = status.response.raiMediaFilteredReasons || [];
      const reasonText = reasons.length > 0 ? reasons.join(' ') : 'Content filtered by safety policies';
      console.error('Video filtered by RAI:', reasonText);
      throw new Error(`Video generation blocked: ${reasonText}`);
    }

    // Get the generated video from the response
    const generatedVideo = status.response?.generatedVideos?.[0];
    if (!generatedVideo?.video?.uri) {
      console.error('Full status response:', JSON.stringify(status, null, 2));
      throw new Error('No video in response. The video may have been filtered or generation failed.');
    }

    const videoUri = generatedVideo.video.uri;
    console.log('Video file URI:', videoUri);
    
    // Fetch the video with API key authentication
    // The URI already includes ?alt=media, we just need to add the API key
    const authenticatedUri = `${videoUri}&key=${apiKey}`;
    console.log('Downloading video...');
    
    const videoResponse = await fetch(authenticatedUri);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    console.log('Video downloaded, size:', videoBlob.size, 'bytes');
    
    // Convert to data URL
    const videoDataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(videoBlob);
    });

    return videoDataURL;
  } catch (error: any) {
    console.error('Video generation failed:', error);
    
    // If video model is not available, provide helpful error
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error('Video generation model (veo-3.0-generate-001) is not yet available in your region. The model may still be in limited preview. Please use static image generation for now.');
    }
    
    throw new Error(`Video generation failed: ${error.message}`);
  }
};

export const generateImageWithFal = async (
  imageFile: File,
  prompt: string,
  options?: GenerationOptions
): Promise<string> => {
  try {
    // Validate configuration
    if (!validateConfig()) {
      throw new Error('Invalid API configuration. Please check your credentials in Settings.');
    }

    const config = getConfig();
    
    // ⚠️ YOUR API KEY IS USED HERE - Get it from: https://aistudio.google.com/app/apikey
    // The API key is stored in localStorage and retrieved via getConfig()
    
    const generateMotion = options?.generateMotion || false;
    const aspectRatio = options?.aspectRatio || '16:9';
    
    console.log(`Generating ${generateMotion ? 'video' : 'image'} with Google GenAI...`, { 
      prompt: prompt.substring(0, 100) + '...',
      motion: generateMotion,
      aspectRatio: generateMotion ? aspectRatio : 'N/A'
    });

    // Initialize Google GenAI with API key
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    // Convert uploaded image to data URL for context
    const imageDataURL = await fileToDataURL(imageFile);
    
    // If motion generation is requested, use video model
    if (generateMotion) {
      return await generateVideoWithMotion(ai, imageFile, prompt, config.apiKey, aspectRatio);
    }
    
    // Otherwise, generate static image
    // Combine the uploaded image context with the prompt
    // The model will use the reference image to maintain facial features
    const fullPrompt = `Using the reference person in the provided image, ${prompt}`;

    // Generate image using gemini-2.5-flash-image model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageDataURL.split(',')[1], // Remove data URL prefix
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
      ],
    });

    console.log('Google GenAI response received');

    // Extract the generated image from response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // Convert base64 to data URL
            const mimeType = part.inlineData.mimeType || 'image/png';
            const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            return imageUrl;
          }
        }
      }
    }
    
    throw new Error('No image generated in response');
  } catch (error) {
    console.error('Google GenAI request failed:', error);
    throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 2000; // Start with 2 seconds

// Helper function to generate image with retry logic and exponential backoff
const generateImageWithRetry = async (
  imageFile: File,
  prompt: string,
  promptIndex: number,
  options?: GenerationOptions,
  retryCount = 0
): Promise<string> => {
  try {
    console.log(`Generating image ${promptIndex + 1}...`);
    return await generateImageWithFal(imageFile, prompt, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a rate limit error (429)
    const isRateLimitError = errorMessage.includes('429') || 
                             errorMessage.includes('RESOURCE_EXHAUSTED') ||
                             errorMessage.includes('quota');
    
    // Check if it's a daily quota exhaustion (can't retry - need to wait until tomorrow)
    const isDailyQuotaExhausted = errorMessage.includes('PerDay') || 
                                   errorMessage.includes('limit: 0');
    
    if (isRateLimitError && !isDailyQuotaExhausted && retryCount < MAX_RETRIES) {
      // Calculate exponential backoff delay with jitter to prevent thundering herd
      const baseDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
      const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
      const retryDelay = baseDelay + jitter;
      console.log(`Image ${promptIndex + 1} rate limited. Retrying in ${(retryDelay / 1000).toFixed(1)}s (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(retryDelay);
      return generateImageWithRetry(imageFile, prompt, promptIndex, options, retryCount + 1);
    }
    
    throw error;
  }
};

export const batchGenerateImages = async (
  imageFile: File,
  prompts: string[],
  options?: GenerationOptions
): Promise<Array<{ prompt: string; imageUrl: string | null; error?: string }>> => {
  // Process all images in parallel, each with its own retry logic
  const results = await Promise.allSettled(
    prompts.map(async (prompt, index) => {
      try {
        const imageUrl = await generateImageWithRetry(imageFile, prompt, index, options);
        return { prompt, imageUrl };
      } catch (error) {
        console.error(`Failed to process prompt "${prompt}":`, error);
        return { 
          prompt, 
          imageUrl: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        prompt: prompts[index],
        imageUrl: null,
        error: result.reason instanceof Error ? result.reason.message : 'Processing failed'
      };
    }
  });
};