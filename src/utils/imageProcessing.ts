// Real AI processing is now handled by falClient.ts
// This file now only contains watermarking and download utilities

export const addWatermark = async (
  imageUrl: string,
  logoUrl: string | null
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        // Draw main image
        ctx.drawImage(img, 0, 0);
        
        if (logoUrl) {
          // Add logo watermark
          const logo = new Image();
          logo.onload = () => {
            const logoSize = Math.min(img.width * 0.15, img.height * 0.15, 100);
            const x = 20;
            const y = img.height - logoSize - 20;
            
            // Add semi-transparent background for logo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x - 10, y - 10, logoSize + 20, logoSize + 20);
            
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            resolve(canvas.toDataURL('image/png'));
          };
          logo.src = logoUrl;
        } else {
          // Add text watermark if no logo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(10, img.height - 50, 200, 40);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px Arial';
          ctx.fillText('AI Generated', 20, img.height - 25);
          
          resolve(canvas.toDataURL('image/png'));
        }
      }
    };
    
    img.src = imageUrl;
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};