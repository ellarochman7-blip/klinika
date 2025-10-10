import React from 'react';
import { motion } from 'framer-motion';
import { Download, Loader } from 'lucide-react';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  isProcessing: boolean;
  error?: string;
}

interface OutputGridProps {
  images: GeneratedImage[];
  onDownload: (imageUrl: string, prompt: string) => void;
  onGenerateVideo: (imageUrl: string) => void;
}

export default function OutputGrid({ images, onDownload, onGenerateVideo }: OutputGridProps) {
  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg mb-2">Upload an image and click Generate</p>
        <p className="text-gray-400 text-sm">Your AI-generated images or videos will appear here</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
          <div className="aspect-square relative bg-gray-50">
            {image.isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-center space-y-4 p-6">
                  {image.prompt.includes('VIDEO') ? (
                    <>
                      <div className="relative">
                        <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
                        <svg className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-700 mb-1">🎬 Generating Video</p>
                        <p className="text-xs text-gray-600">This may take 60-120 seconds...</p>
                        <div className="mt-2 flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600">Processing...</p>
                    </>
                  )}
                </div>
              </div>
            ) : image.imageUrl ? (
              <>
                {image.imageUrl.startsWith('data:video/') ? (
                  // Display video
                  <video
                    src={image.imageUrl}
                    controls
                    loop
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  // Display image
                  <img
                    src={image.imageUrl}
                    alt={`Generated from: ${image.prompt}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDownload(image.imageUrl!, image.prompt)}
                  className="absolute top-3 right-3 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all duration-200"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-gray-700" />
                </motion.button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-red-500 text-sm font-medium mb-1">Generation Failed</p>
                  {image.error && (
                    <p className="text-gray-400 text-xs">{image.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 line-clamp-3">{image.prompt}</p>
            {image.error && (
              <p className="text-red-500 text-xs mt-2 font-medium">Error: {image.error}</p>
            )}
            {image.imageUrl && (
              <div className="mt-3 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDownload(image.imageUrl!, image.prompt)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 text-sm font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </motion.button>
                
                {/* Only show Generate Video button for static images, not videos */}
                {!image.imageUrl.startsWith('data:video/') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onGenerateVideo(image.imageUrl!)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generate Video
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}