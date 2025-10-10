import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Upload, Save, Plus, Trash2 } from 'lucide-react';

interface PromptSettingsProps {
  isOpen: boolean;
  onToggle: () => void;
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  videoPrompts: string[];
  onVideoPromptsChange: (prompts: string[]) => void;
  logo: string | null;
  onLogoChange: (file: File) => void;
}

export default function PromptSettings({
  isOpen,
  onToggle,
  prompts,
  onPromptsChange,
  videoPrompts,
  onVideoPromptsChange,
  logo,
  onLogoChange
}: PromptSettingsProps) {
  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    onPromptsChange(newPrompts);
  };

  const handleAddPrompt = () => {
    onPromptsChange([...prompts, '']);
  };

  const handleRemovePrompt = (index: number) => {
    if (prompts.length > 1) {
      const newPrompts = prompts.filter((_, i) => i !== index);
      onPromptsChange(newPrompts);
    }
  };

  const handleVideoPromptChange = (index: number, value: string) => {
    const newPrompts = [...videoPrompts];
    newPrompts[index] = value;
    onVideoPromptsChange(newPrompts);
  };

  const handleAddVideoPrompt = () => {
    onVideoPromptsChange([...videoPrompts, '']);
  };

  const handleRemoveVideoPrompt = (index: number) => {
    if (videoPrompts.length > 1) {
      const newPrompts = videoPrompts.filter((_, i) => i !== index);
      onVideoPromptsChange(newPrompts);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'image/svg+xml')) {
      onLogoChange(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        />

        {/* Side Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
        >
              <div className="p-6 space-y-6">
                <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Prompt Manager</h2>
                      <p className="text-sm text-gray-500">Add, edit, and remove AI prompts</p>
                    </div>
                    <button
                      onClick={onToggle}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-700">AI Prompts</h3>
                    <span className="text-sm text-gray-500">{prompts.length} prompt{prompts.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {prompts.map((prompt, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-600">
                            Prompt {index + 1}
                          </label>
                          {prompts.length > 1 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemovePrompt(index)}
                              className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors"
                              title="Remove prompt"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                        <textarea
                          value={prompt}
                          onChange={(e) => handlePromptChange(index, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                          rows={4}
                          placeholder={`Enter prompt ${index + 1}...`}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddPrompt}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-600 rounded-md transition-all duration-200 font-medium border border-blue-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Prompt
                  </motion.button>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-700">Video Motion Prompts</h3>
                    <span className="text-sm text-gray-500">{videoPrompts.length} prompt{videoPrompts.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {videoPrompts.map((prompt, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-600">
                            Video Prompt {index + 1}
                          </label>
                          {videoPrompts.length > 1 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveVideoPrompt(index)}
                              className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors"
                              title="Remove video prompt"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                        <textarea
                          value={prompt}
                          onChange={(e) => handleVideoPromptChange(index, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                          rows={3}
                          placeholder={`Enter video motion prompt ${index + 1}...`}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddVideoPrompt}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-purple-600 rounded-md transition-all duration-200 font-medium border border-purple-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Video Prompt
                  </motion.button>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700">Watermark Logo</h3>
                  <p className="text-sm text-gray-600">
                    Add your logo as a watermark on downloaded images
                  </p>
                  {logo && (
                    <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center">
                      <img
                        src={logo}
                        alt="Logo"
                        className="max-w-[120px] max-h-[120px] object-contain"
                      />
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('logo-input')?.click()}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200 font-medium"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logo ? 'Change Logo' : 'Upload Logo'}
                  </motion.button>
                  <input
                    id="logo-input"
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Supports PNG, JPG, and SVG (vector) formats
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onToggle}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 font-medium"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
    </AnimatePresence>
  );
}