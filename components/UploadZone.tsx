import React, { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  subLabel?: string;
  image: string | null;
  onUpload: (base64: string) => void;
  onClear: () => void;
  isDarkMode?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ label, subLabel, image, onUpload, onClear, isDarkMode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onUpload(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#6C757D] dark:text-slate-500 text-center">{label}</span>
        {subLabel && <span className="text-[10px] text-[#6C757D] dark:text-slate-500 text-center leading-tight">{subLabel}</span>}
      </div>
      <div 
        className={`relative h-44 rounded-[20px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
          ${image ? 'border-transparent shadow-md' : 'border-[#E0E0E0] dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-900/50 hover:border-[#2962FF] hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
        `}
      >
        {image ? (
          <>
            <img src={image} alt={label} className="w-full h-full object-cover" />
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer p-4 w-full h-full justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#2962FF] animate-pulse-slow">
              <Camera size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#212529] dark:text-white">Tap to Upload</p>
              <p className="text-[10px] text-[#6C757D] dark:text-slate-400">Camera or Gallery</p>
            </div>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadZone;