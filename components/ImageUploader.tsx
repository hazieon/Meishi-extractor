
import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';


interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  imagePreviews: string[];
  onClearFile: (index: number) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesChange, imagePreviews, onClearFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesChange(Array.from(event.target.files));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-purple-500', 'bg-slate-700/50');
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFilesChange(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-purple-500', 'bg-slate-700/50');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-purple-500', 'bg-slate-700/50');
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        className="group relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-purple-500/80 transition-all duration-300"
        onClick={triggerFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="text-center">
            <div className="mx-auto text-slate-400 group-hover:text-purple-400 transition-colors duration-300">
                <UploadIcon />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-300">
                Drag & drop your business cards here
            </p>
            <p className="text-slate-500">or click to browse files</p>
            <p className="mt-2 text-xs text-slate-600">Supports: PNG, JPG, WEBP</p>
        </div>
      </div>
      {imagePreviews.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-300 mb-3">Selected Images:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {imagePreviews.map((src, index) => (
              <div key={index} className="relative group aspect-video">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
                 <button 
                    onClick={(e) => { e.stopPropagation(); onClearFile(index);}}
                    className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-0.5 text-slate-400 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                >
                    <XCircleIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
