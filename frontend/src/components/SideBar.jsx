import React, { useState } from 'react';

const Sidebar = ({isHovered, setIsHovered}) => {
    
    
    const menuItems = [
        { icon: '✦', label: 'Create Constellation' },
        { icon: '◈', label: 'Past Constellations' },
        { icon: '⚙', label: 'Settings' },
    ];

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex flex-col h-full text-gray-100 pb-6 transition-all duration-300 ease-in-out ${isHovered ? 'w-56' : 'w-16'} overflow-hidden border-r border-gray-800`}
            style={{ background: '#0a0818' }}
        >
            {/* Logo Section */}
            <div className="flex items-center px-2 py-2 mx-2">
                <div className="w-8 h-8 flex-shrink-0 rounded-md bg-gray-800 flex items-center justify-center text-gray-300 font-bold text-lg">
                    N
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 mb-6 h-px bg-gray-800" />

            {/* Menu Items */}
            <nav className="flex flex-col gap-1 px-0 flex-1">
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center px-2 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-900 group mx-2"
                    >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 text-lg group-hover:text-gray-200 transition-all duration-200">
                            {item.icon}
                        </span>
                        <span className={`ml-3 font-rajdhani font-normal text-gray-400 whitespace-nowrap transition-all duration-300 group-hover:text-gray-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </nav>

            {/* Bottom Section — bar aligns with header bottom (60px) */}
            <div className="mt-auto" style={{ paddingTop: 'calc(60px - 6rem)' }}>
                <div className="mx-2 mb-4 h-px bg-gray-800" />
                <div className="flex items-center px-2 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-900 group mx-2">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 text-lg group-hover:text-gray-200 transition-all duration-200">
                        ◉
                    </span>
                    <span className={`ml-3 font-rajdhani font-normal text-gray-400 whitespace-nowrap transition-all duration-300 group-hover:text-gray-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        Profile
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;