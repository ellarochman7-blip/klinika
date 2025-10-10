// Real AI processing is now handled by falClient.ts
// This file now only contains watermarking and download utilities

export const addVideoWatermark = async (
  videoUrl: string,
  logoUrl: string | null
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Load logo if provided
        let logoImg: HTMLImageElement | null = null;
        if (logoUrl) {
          logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolveImg, rejectImg) => {
            logoImg!.onload = resolveImg;
            logoImg!.onerror = rejectImg;
            logoImg!.src = logoUrl;
          });
        }
        
        // Prepare MediaRecorder
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 5000000 // 5 Mbps
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        };
        
        // Start recording
        mediaRecorder.start();
        video.currentTime = 0;
        video.play();
        
        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Draw watermark logo in upper 20%
          if (logoImg) {
            const logoHeight = canvas.height * 0.2; // Upper 20%
            const logoWidth = canvas.width;
            
            // Semi-transparent white background for logo visibility
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(0, 0, logoWidth, logoHeight);
            
            // Draw logo centered in the upper area
            const logoAspectRatio = logoImg.width / logoImg.height;
            let drawWidth = logoWidth * 0.8; // 80% of width for padding
            let drawHeight = drawWidth / logoAspectRatio;
            
            // If height exceeds available space, scale down
            if (drawHeight > logoHeight * 0.8) {
              drawHeight = logoHeight * 0.8;
              drawWidth = drawHeight * logoAspectRatio;
            }
            
            const x = (logoWidth - drawWidth) / 2;
            const y = (logoHeight - drawHeight) / 2;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(logoImg, x, y, drawWidth, drawHeight);
          }
          
          requestAnimationFrame(drawFrame);
        };
        
        drawFrame();
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = videoUrl;
    } catch (error) {
      reject(error);
    }
  });
};

export const addWatermark = async (
  imageUrl: string,
  logoUrl: string | null
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Enable CORS for external images
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        // Draw main image
        ctx.drawImage(img, 0, 0);
        
        if (logoUrl) {
          // Add logo watermark (supports both raster and vector/SVG)
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          
          logo.onload = () => {
            // Calculate logo size (responsive, max 15% of image or 150px)
            const logoSize = Math.min(img.width * 0.15, img.height * 0.15, 150);
            const padding = 20;
            const x = padding;
            const y = img.height - logoSize - padding;
            
            // Add semi-transparent white background for logo visibility
            const bgPadding = 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillRect(
              x - bgPadding, 
              y - bgPadding, 
              logoSize + bgPadding * 2, 
              logoSize + bgPadding * 2
            );
            
            // Draw logo with high quality
            // SVG images will render as vectors and scale perfectly
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            
            resolve(canvas.toDataURL('image/png', 0.95));
          };
          
          logo.onerror = () => {
            console.error('Failed to load logo');
            // Fallback to text watermark if logo fails
            addTextWatermark(ctx, img);
            resolve(canvas.toDataURL('image/png', 0.95));
          };
          
          logo.src = logoUrl;
        } else {
          // Add text watermark if no logo
          addTextWatermark(ctx, img);
          resolve(canvas.toDataURL('image/png', 0.95));
        }
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

// Helper function to add text watermark
const addTextWatermark = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
  const padding = 10;
  const height = 40;
  const width = 200;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(padding, img.height - height - padding, width, height);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI Generated', padding + 10, img.height - height / 2 - padding);
};

export const downloadMedia = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

// Legacy function for backwards compatibility
export const downloadImage = downloadMedia;