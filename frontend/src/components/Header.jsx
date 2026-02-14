import React from 'react'

function Header({isHovered}) {
  return (
    <div className="header">
      <h1 className={`font-orbitron text-xl font-semibold text-gray-300 transition-all duration-300`}>
        NEXUS
      </h1>
    </div>
  )
}

export default Header