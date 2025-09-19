import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Upload, Save } from 'lucide-react';

interface PromptSettingsProps {
  isOpen: boolean;
  onToggle: () => void;
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
  logo: string | null;
  onLogoChange: (file: File) => void;
}

export default function PromptSettings({
  isOpen,
  onToggle,
  prompts,
  onPromptsChange,
  logo,
  onLogoChange
}: PromptSettingsProps) {
  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    onPromptsChange(newPrompts);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onLogoChange(file);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-shadow duration-200"
      >
        <Settings className={`w-6 h-6 text-gray-600 transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-40 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                  <button
                    onClick={onToggle}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">AI Prompts</h3>
                  {prompts.map((prompt, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">
                        Prompt {index + 1}
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => handlePromptChange(index, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        rows={3}
                        placeholder={`Enter prompt ${index + 1}...`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Watermark Logo</h3>
                  {logo && (
                    <div className="relative">
                      <img
                        src={logo}
                        alt="Logo"
                        className="w-20 h-20 object-contain bg-gray-50 rounded-md border border-gray-200"
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
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}