import { useState, useRef, useEffect } from 'react';

// Clean SVG icons
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

function UploadButton() {
    const [isClicked, setIsClicked] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const uploads = [
        {type: 'image', label: 'Image', Icon: ImageIcon},
        {type: 'file', label: 'File', Icon: FileIcon},
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                if (isClicked) {
                    setIsClosing(true);
                    setTimeout(() => {
                        setIsClicked(false);
                        setIsClosing(false);
                    }, 200); // Match animation duration
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isClicked]);

    return (
        <div ref={containerRef} className="relative">
            {isClicked && (
            <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg shadow-black/50 p-2 flex flex-col gap-1 min-w-[160px] backdrop-blur-sm z-10 ${isClosing ? 'upload-menu-close' : 'upload-menu-open'}`}>
                {uploads.map(upload => (
                <button key={upload.type} className="flex items-center gap-2 hover:bg-gray-700 rounded-md px-3 py-2 transition-colors text-sm text-gray-300 hover:text-gray-100 whitespace-nowrap">
                    <upload.Icon />
                    Upload {upload.label}
                </button>
                ))}
            </div>
            )}
            <button 
            className="bg-gray-800 border border-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-700 hover:text-white transition-colors" 
            onClick={() => {
                if (isClicked) {
                    setIsClosing(true);
                    setTimeout(() => {
                        setIsClicked(false);
                        setIsClosing(false);
                    }, 200);
                } else {
                    setIsClicked(true);
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            >
            
                <span className={`inline-block text-xl transition-transform duration-300 ${isClicked ? 'rotate-45' : isHovered ? 'rotate-90' : 'rotate-0'}`}>
                    +
                </span>
            
            </button>
        </div>
   
  )
}

export default UploadButton