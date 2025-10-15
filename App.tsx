
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Spinner } from './components/Spinner';
import { extractContactsFromImages } from './services/geminiService';
import { ContactInfo } from './types';

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [extractedContacts, setExtractedContacts] = useState<ContactInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    setExtractedContacts([]);
    setError(null);

    const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
    // Revoke old object URLs to prevent memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews(newPreviews);
  };

  const handleClearFile = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    if(newFiles.length === 0) {
        setExtractedContacts([]);
        setError(null);
    }
  };
  
  const handleExtract = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one image file.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setExtractedContacts([]);

    try {
      const contacts = await extractContactsFromImages(selectedFiles);
      setExtractedContacts(contacts);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFiles]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
                Business Card Extractor
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Upload photos of business cards, and let Gemini AI instantly pull out names, emails, and LinkedIn profiles.
            </p>
        </div>

        <div className="max-w-4xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700 backdrop-blur-sm">
          <div className="p-6 md:p-8">
            <ImageUploader 
                onFilesChange={handleFilesChange} 
                imagePreviews={imagePreviews}
                onClearFile={handleClearFile}
            />

            {selectedFiles.length > 0 && (
                <div className="mt-8 text-center">
                    <button
                        onClick={handleExtract}
                        disabled={isLoading}
                        className="w-full md:w-auto px-8 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <Spinner />
                                <span className="ml-2">Extracting...</span>
                            </div>
                        ) : 'Extract Information'}
                    </button>
                </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            
            {extractedContacts.length > 0 && !isLoading && (
              <div className="mt-10">
                <ResultsDisplay contacts={extractedContacts} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
