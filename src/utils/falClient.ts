import * as fal from "@fal-ai/serverless-client";

// Configure Fal client with API key
fal.config({
  credentials: "86c4a793-ba25-4f1f-8988-da125d422590:65f8a845a29f7d77c35aebf70dbb71a4",
});

export interface FalImageRequest {
  image_url: string;
  prompt: string;
  image_size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
  num_inference_steps?: number;
  guidance_scale?: number;
  strength?: number;
  seed?: number;
  sync_mode?: boolean;
}

export interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export const generateImageWithFal = async (
  imageFile: File,
  prompt: string
): Promise<string> => {
  try {
    // Convert file to base64 data URL for upload
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(imageFile);
    });

    // Upload image to Fal storage
    const imageUrl = await fal.storage.upload(imageFile);

    // Prepare request parameters
    const request: FalImageRequest = {
      image_url: imageUrl,
      prompt: prompt,
      image_size: "square_hd",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      strength: 0.85,
      sync_mode: true
    };

    console.log('Sending request to Fal AI:', { prompt, imageUrl: imageUrl.substring(0, 50) + '...' });

    // Make request to Fal AI
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: request,
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      },
    }) as FalImageResponse;

    console.log('Fal AI response:', result);

    if (result.images && result.images.length > 0) {
      return result.images[0].url;
    } else {
      throw new Error('No images generated');
    }
  } catch (error) {
    console.error('Fal AI request failed:', error);
    throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const batchGenerateImages = async (
  imageFile: File,
  prompts: string[]
): Promise<Array<{ prompt: string; imageUrl: string | null; error?: string }>> => {
  const results = await Promise.allSettled(
    prompts.map(async (prompt) => {
      try {
        const imageUrl = await generateImageWithFal(imageFile, prompt);
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