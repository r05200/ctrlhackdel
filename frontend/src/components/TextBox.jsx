import React, { useState } from 'react'
import UploadButton from './UploadButton'

function TextBox({ onSubmit }) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit?.(value.trim());
    }
  };

  return (
    <div className="text-box flex justify-center items-center gap-2 w-full">
        <div className="relative w-full">
          <input 
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text here..." 
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-full text-white focus:outline-none pl-[72px]" 
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <UploadButton />
          </div>
        </div>
    </div>
  )
}

export default TextBox