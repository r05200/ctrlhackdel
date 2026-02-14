import React from 'react'

function TextBox() {
  return (
    <div className="text-box flex justify-center items-center gap-2 w-full">
        <div className="relative flex items-center w-full">
          <input 
            type="text" 
            placeholder="Enter text here..." 
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-full text-white focus:outline-none pl-14" 
          />
          <button className="absolute left-2 bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-white hover:bg-gray-600 transition-colors">
            +
          </button>
        </div>
        
    </div>
  )
}

export default TextBox