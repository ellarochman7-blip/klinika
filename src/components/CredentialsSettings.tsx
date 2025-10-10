import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';
import { getStoredCredentials, saveCredentials, clearCredentials } from '../config/credentials';

interface CredentialsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsSaved?: () => void;
}

export default function CredentialsSettings({ 
  isOpen, 
  onClose,
  onCredentialsSaved 
}: CredentialsSettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCredentials();
      setApiKey(stored.apiKey || '');
      setProjectId(stored.projectId || '');
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your Google AI Studio API Key');
      return;
    }

    setIsSaving(true);
    try {
      saveCredentials(apiKey.trim(), projectId.trim());
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onCredentialsSaved?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving credentials:', error);
      alert('Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your saved credentials?')) {
      clearCredentials();
      setApiKey('');
      setProjectId('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">API Credentials</h2>
                <p className="text-sm text-gray-500">Configure your Google AI Studio settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Your credentials are stored locally</p>
                <p className="text-blue-700">
                  API key is saved in your browser's localStorage and only sent to Google AI Studio's API.
                </p>
              </div>
            </div>

            {/* API Key Field */}
            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700">
                Google AI Studio API Key
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (paste your API key here)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Get your API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline font-semibold"
                >
                  Google AI Studio → Get API Key
                </a>
              </p>
            </div>

            {/* Model Name Field (Optional) */}
            <div className="space-y-2">
              <label htmlFor="projectId" className="block text-sm font-semibold text-gray-700">
                Model Name
                <span className="text-gray-400 ml-1 font-normal">(Optional)</span>
              </label>
              <input
                id="projectId"
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="imagen-3.0-generate-001 (default)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Leave empty to use the default Imagen 3 model
              </p>
            </div>

            {/* Setup Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                <SettingsIcon className="w-4 h-4" />
                <span>Quick Setup (2 steps)</span>
              </h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Google AI Studio</a></li>
                <li>Click <strong>"Get API Key"</strong> → Create/select a project → Copy your API key</li>
                <li>Paste the API key above and click <strong>Save</strong></li>
              </ol>
              <p className="text-xs text-gray-600 mt-3 bg-yellow-50 border border-yellow-200 p-2 rounded">
                💡 <strong>Tip:</strong> Uses `gemini-2.5-flash-image` model - preserves facial features from your uploaded photo!
              </p>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
                >
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-800">Credentials saved successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleClear}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Clear Credentials
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-all duration-200 flex items-center space-x-2 ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Credentials</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

