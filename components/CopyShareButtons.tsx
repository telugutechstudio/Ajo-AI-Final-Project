
import React, { useState } from 'react';
import { CopyIcon, ShareIcon, CheckIcon } from './icons';

interface CopyShareButtonsProps {
  textToCopy: string;
  shareTitle?: string;
}

const CopyShareButtons: React.FC<CopyShareButtonsProps> = ({ textToCopy, shareTitle = 'Shared Text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, (err) => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy text.');
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: textToCopy,
        });
      } catch (error) {
        // We can ignore abort errors
        if (error instanceof Error && error.name !== 'AbortError') {
             console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
      alert('Sharing is not supported on this browser. Text has been copied to the clipboard instead.');
    }
  };

  return (
    <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg">
      <button 
        onClick={handleCopy} 
        title={copied ? "Copied!" : "Copy text"} 
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/80 rounded-md transition-all duration-200"
        aria-label={copied ? "Copied text" : "Copy text"}
      >
        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
      </button>
      {/* navigator.share is a good check for share capabilities */}
      {typeof navigator.share === 'function' && (
         <button 
            onClick={handleShare} 
            title="Share text" 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/80 rounded-md transition-colors"
            aria-label="Share text"
        >
            <ShareIcon className="w-5 h-5" />
         </button>
      )}
    </div>
  );
};

export default CopyShareButtons;